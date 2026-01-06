import 'reflect-metadata';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { container } from './config/inversify.config';
import { connectMongoDB } from './config/mongodb.config';
import { consumer } from './config/kafka.config';
import { IChatService } from './services/interfaces/IChatService';
import { ApplicationServiceClient } from './services/implementations/ApplicationServiceClient';
import { TYPES } from './config/types';
import { sendMessageSchema, markAsReadSchema, typingIndicatorSchema } from './dto/schemas/chat.schema';
import app from './app';
import { StatusUpdatedEventData } from './types/events';
import { 
  WebRTCRoom, 
  WebRTCParticipant,
  JoinRoomData,
  OfferData,
  AnswerData,
} from './types/webrtc.types';
import { 
  joinRoomSchema, 
  offerSchema, 
  answerSchema, 
  iceCandidateDataSchema, 
} from './dto/schemas/webrtc.schema';
import { WebRTCEvent } from './constants/webrtc.events';
import { serializeRoom } from './utils/webrtc.utils';
import { Messages } from './constants/Messages';
import { AppConfig } from './config/app.config';

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: AppConfig.FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
});

const webrtcRooms = new Map<string, WebRTCRoom>();
const onlineUsers = new Map<string, Set<string>>();
const socketToUserId = new Map<string, string>();

io.on('connection', (socket) => {
  socket.on('register-user', (data: { userId: string }) => {
    const { userId } = data;
    if (!userId) return;

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);
    socketToUserId.set(socket.id, userId);
    
    console.log(`[SERVER] User ${userId} registered as online (socket: ${socket.id})`);

    socket.rooms.forEach(roomId => {
      if (roomId !== socket.id) { 
        socket.to(roomId).emit('user-online', { userId });
      }
    });

    socket.broadcast.emit('user-online', { userId });
  });
  
  socket.on('test-event', (data: unknown) => {
    console.log('[SERVER] Test event received:', data);
    socket.emit('test-response', { received: true, data });
  });
  
  socket.on('join-conversation', (conversationId: string) => {
    socket.join(conversationId);

    const userId = socketToUserId.get(socket.id);
    if (userId) {
      // Notify others in the conversation that this user is online
      socket.to(conversationId).emit('user-online', { userId });
      
      // Send list of already-online users in this conversation to the new joiner
      const room = io.sockets.adapter.rooms.get(conversationId);
      if (room) {
        const onlineUsersInRoom = new Set<string>();
        room.forEach(socketId => {
          const otherUserId = socketToUserId.get(socketId);
          if (otherUserId && otherUserId !== userId && onlineUsers.has(otherUserId)) {
            onlineUsersInRoom.add(otherUserId);
          }
        });
        
        // Send online status for each user already in the conversation
        onlineUsersInRoom.forEach(otherUserId => {
          socket.emit('user-online', { userId: otherUserId });
        });
      }
    }
  });
  
  socket.on('leave-conversation', (conversationId: string) => {
    socket.leave(conversationId);
  });
  
  socket.on('send-message', async (data: unknown) => {
    try {
      const validationResult = sendMessageSchema.safeParse(data);
      if (!validationResult.success) {
        const errorDetails = validationResult.error.issues.map(issue => issue.message).join(', ');
        socket.emit('message-error', { 
          error: Messages.ERROR.VALIDATION_FAILED, 
          details: errorDetails,
        });
        return;
      }

      socket.to(validationResult.data.conversationId).emit('user-typing', {
        userId: validationResult.data.senderId,
        isTyping: false,
      });

      const _chatService = container.get<IChatService>(TYPES.IChatService);
      const message = await _chatService.sendMessage(
        validationResult.data.conversationId,
        validationResult.data.senderId,
        validationResult.data.content,
        validationResult.data.messageType || 'text',
      );
      
      io.to(validationResult.data.conversationId).emit('new-message', message);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      socket.emit('message-error', { error: errorMessage });
    }
  });
  
  socket.on('typing', (data: unknown) => {
    const validationResult = typingIndicatorSchema.safeParse(data);
    if (!validationResult.success) {
      return; 
    }
    
    socket.to(validationResult.data.conversationId).emit('user-typing', {
      userId: validationResult.data.userId,
      isTyping: validationResult.data.isTyping,
    });
  });

  socket.on('mark-as-read', async (data: unknown) => {
    try {
      const validationResult = markAsReadSchema.safeParse(data);
      if (!validationResult.success) {
        return; 
      }

      const _chatService = container.get<IChatService>(TYPES.IChatService);
      await _chatService.markAsRead(
        validationResult.data.conversationId, 
        validationResult.data.userId,
      );
      io.to(validationResult.data.conversationId).emit('messages-read', {
        conversationId: validationResult.data.conversationId,
        userId: validationResult.data.userId,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    }
  });
  
  socket.on(WebRTCEvent.JOIN_ROOM, async (data: unknown) => {
    try {
      const validationResult = joinRoomSchema.safeParse(data);
      if (!validationResult.success) {
        socket.emit(WebRTCEvent.ERROR, {
          interviewId: (data as JoinRoomData).interviewId || 'unknown',
          error: Messages.WEBRTC.VALIDATION_FAILED,
          message: validationResult.error.issues.map(i => i.message).join(', '),
        });
        return;
      }

      const { interviewId, userId, role } = validationResult.data;

      let room = webrtcRooms.get(interviewId);
      if (!room) {
        room = {
          interviewId,
          participants: new Map(),
          createdAt: new Date(),
        };
        webrtcRooms.set(interviewId, room);
       
      }

      const existingParticipant = Array.from(room.participants.values())
        .find(p => p.userId === userId);
      
      if (existingParticipant) {
        
        room.participants.delete(existingParticipant.socketId);
      }

      const participant: WebRTCParticipant = {
        userId,
        socketId: socket.id,
        role,
        joinedAt: new Date(),
      };
      room.participants.set(socket.id, participant);
      socket.join(interviewId);
      const serializedRoom = serializeRoom(room);
      socket.emit(WebRTCEvent.ROOM_JOINED, {
        interviewId,
        room: serializedRoom,
      });
      if (room.participants.size > 1) {
        const participants = Array.from(room.participants.values());

        const newParticipant = participants.find(p => p.socketId === socket.id);
        if (newParticipant) {
          socket.to(interviewId).emit(WebRTCEvent.PEER_JOINED, {
            interviewId,
            peer: {
              userId: newParticipant.userId,
              role: newParticipant.role,
            },
          });
        }

        const existingParticipants = participants.filter(p => p.socketId !== socket.id);
        existingParticipants.forEach(existingParticipant => {
          socket.emit(WebRTCEvent.PEER_JOINED, {
            interviewId,
            peer: {
              userId: existingParticipant.userId,
              role: existingParticipant.role,
            },
          });
        });
      } else {
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      socket.emit(WebRTCEvent.ERROR, {
        interviewId: (data as JoinRoomData).interviewId || 'unknown',
        error: Messages.WEBRTC.FAILED_TO_JOIN_ROOM,
        message: errorMessage,
      });
    }
  });

  socket.on(WebRTCEvent.OFFER, (data: unknown) => {
    try {
      const validationResult = offerSchema.safeParse(data);
      if (!validationResult.success) {
        socket.emit(WebRTCEvent.ERROR, {
          interviewId: (data as OfferData).interviewId || 'unknown',
          error: Messages.WEBRTC.INVALID_OFFER_DATA,
        });
        return;
      }

      const { interviewId, offer, fromUserId, toUserId } = validationResult.data;
      const room = webrtcRooms.get(interviewId);

      if (!room) {
        socket.emit(WebRTCEvent.ERROR, {
          interviewId,
          error: Messages.WEBRTC.ROOM_NOT_FOUND,
        });
        return;
      }

      const targetParticipant = Array.from(room.participants.values())
        .find(p => p.userId === toUserId);

      if (!targetParticipant) {
        socket.emit(WebRTCEvent.ERROR, {
          interviewId,
          error: Messages.WEBRTC.TARGET_USER_NOT_IN_ROOM,
        });
        return;
      }

      io.to(targetParticipant.socketId).emit(WebRTCEvent.OFFER, {
        interviewId,
        offer,
        fromUserId,
        toUserId,
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
    }
  });

  socket.on(WebRTCEvent.ANSWER, (data: unknown) => {
    try {
      const validationResult = answerSchema.safeParse(data);
      if (!validationResult.success) {
        socket.emit(WebRTCEvent.ERROR, {
          interviewId: (data as AnswerData).interviewId || 'unknown',
          error: Messages.WEBRTC.INVALID_ANSWER_DATA,
        });
        return;
      }

      const { interviewId, answer, fromUserId, toUserId } = validationResult.data;
      const room = webrtcRooms.get(interviewId);

      if (!room) {
        socket.emit(WebRTCEvent.ERROR, {
          interviewId,
          error: Messages.WEBRTC.ROOM_NOT_FOUND,
        });
        return;
      }

      const targetParticipant = Array.from(room.participants.values())
        .find(p => p.userId === toUserId);

      if (!targetParticipant) {
        socket.emit(WebRTCEvent.ERROR, {
          interviewId,
          error: Messages.WEBRTC.TARGET_USER_NOT_IN_ROOM,
        });
        return;
      }

      io.to(targetParticipant.socketId).emit(WebRTCEvent.ANSWER, {
        interviewId,
        answer,
        fromUserId,
        toUserId,
      });

      console.log(`${Messages.WEBRTC.ANSWER_FORWARDED} from ${fromUserId} to ${toUserId} in room ${interviewId}`);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
    }
  });

  socket.on(WebRTCEvent.ICE_CANDIDATE, (data: unknown) => {
    try {
      const validationResult = iceCandidateDataSchema.safeParse(data);
      if (!validationResult.success) {
        return;
      }

      const { interviewId, candidate, fromUserId, toUserId } = validationResult.data;
      const room = webrtcRooms.get(interviewId);

      if (!room) {
        return;
      }

      const targetParticipant = Array.from(room.participants.values())
        .find(p => p.userId === toUserId);

      if (!targetParticipant) {
        return;
      }

      io.to(targetParticipant.socketId).emit(WebRTCEvent.ICE_CANDIDATE, {
        interviewId,
        candidate,
        fromUserId,
        toUserId,
      });

    } catch (error: unknown) {
      console.error('Error in ice-candidate handler:', error);
    }
  });

  socket.on(WebRTCEvent.USER_LEFT, (data: unknown) => {
    try {
      const { interviewId, userId } = data as { interviewId: string; userId: string };
      const room = webrtcRooms.get(interviewId);

      if (room) {
        const participant = Array.from(room.participants.values())
          .find(p => p.userId === userId);
        
        if (participant) {
          room.participants.delete(participant.socketId);
        }
   
        socket.to(interviewId).emit(WebRTCEvent.USER_LEFT, {
          interviewId,
          userId,
        });

        if (room.participants.size === 0) {
          webrtcRooms.delete(interviewId);
          console.log(`${Messages.WEBRTC.ROOM_CLEANED_UP}: ${interviewId}`);
        }
      }
    } catch (error: unknown) {
      console.error('Error in user-left handler:', error);
    }
  });

  socket.on('disconnect', () => {

    const userId = socketToUserId.get(socket.id);
    if (userId) {
      const userSockets = onlineUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        
       
        if (userSockets.size === 0) {
          onlineUsers.delete(userId);

          socket.rooms.forEach(roomId => {
            if (roomId !== socket.id) {
              socket.to(roomId).emit('user-offline', { userId });
            }
          });

          socket.broadcast.emit('user-offline', { userId });
        } else {
          
        }
      }
      socketToUserId.delete(socket.id);
    }

    for (const [interviewId, room] of webrtcRooms.entries()) {
      const participant = room.participants.get(socket.id);
      if (participant) {
        room.participants.delete(socket.id);
        
        socket.to(interviewId).emit(WebRTCEvent.USER_LEFT, {
          interviewId,
          userId: participant.userId,
        });

        if (room.participants.size === 0) {
          webrtcRooms.delete(interviewId);
          console.log(`${Messages.WEBRTC.ROOM_CLEANED_UP}: ${interviewId}`);
        }
        break;
      }
    }
  });
});

async function initializeKafkaConsumer(): Promise<void> {
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: 'application.status_updated' });

    await consumer.run({
      eachMessage: async ({ message }) => {
        try {
          const eventData = JSON.parse(message.value?.toString() || '{}') as StatusUpdatedEventData;
          if (eventData.newStatus === 'SHORTLISTED') {
            const _chatService = container.get<IChatService>(TYPES.IChatService);
            const _applicationServiceClient = container.get<ApplicationServiceClient>(TYPES.ApplicationServiceClient);
            
            const applicationData = await _applicationServiceClient.getApplicationById(eventData.applicationId);
            const { userId, companyId } = applicationData.data || applicationData;

            if (userId && companyId) {
              await _chatService.createConversationFromApplication(
                eventData.applicationId,
                userId,
                companyId,
              );
            }
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
        }
      },
    });

 
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  }
}

async function initializeServices(): Promise<void> {
  try {
    await connectMongoDB();
    console.log('MongoDB connected successfully');
    
    await initializeKafkaConsumer();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to initialize services:', errorMessage);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  
  try {
    await consumer.disconnect();
    console.log('Kafka consumer disconnected');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error disconnecting Kafka consumer:', errorMessage);
  }
  process.exit(0);
});

export { server, io, initializeServices };