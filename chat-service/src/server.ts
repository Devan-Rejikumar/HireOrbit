import 'reflect-metadata';
import { createServer } from 'http';
import { Server } from 'socket.io';
import axios from 'axios';
import { container } from './config/inversify.config';
import { connectMongoDB } from './config/mongodb.config';
import { consumer } from './config/kafka.config';
import { IChatService } from './services/interfaces/IChatService';
import { TYPES } from './config/types';
import { AppConfig } from './config/app.config';
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

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: AppConfig.FRONTEND_URL,
    methods: ['GET', 'POST'],
  },
});

const webrtcRooms = new Map<string, WebRTCRoom>();

io.on('connection', (socket) => {
  console.log('🔌 [SERVER] ========== NEW SOCKET CONNECTION ==========');
  console.log('🔌 [SERVER] Socket ID:', socket.id);
  console.log('🔌 [SERVER] Socket transport:', socket.conn.transport.name);
  console.log('🔌 [SERVER] Socket connected:', socket.connected);
  
  // Test handler to verify socket is working
  socket.on('test-event', (data: unknown) => {
    console.log('🧪 [SERVER] Test event received:', data);
    socket.emit('test-response', { received: true, data });
  });
  
  socket.on('join-conversation', (conversationId: string) => {
    socket.join(conversationId);
    console.log(`User ${socket.id} joined conversation: ${conversationId}`);
  });
  
  socket.on('leave-conversation', (conversationId: string) => {
    socket.leave(conversationId);
    console.log(`User ${socket.id} left conversation: ${conversationId}`);
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
      console.error('Error marking as read:', errorMessage);
    }
  });

  console.log(`📋 [SERVER] About to register JOIN_ROOM handler for socket ${socket.id}`);
  console.log(`📋 [SERVER] WebRTCEvent.JOIN_ROOM = "${WebRTCEvent.JOIN_ROOM}"`);
  
  socket.on(WebRTCEvent.JOIN_ROOM, async (data: unknown) => {
    console.log('📥 [SERVER] ========== JOIN_ROOM EVENT RECEIVED ==========');
    console.log(`📥 [SERVER] Socket ID: ${socket.id}`);
    console.log(`📥 [SERVER] Event name: ${WebRTCEvent.JOIN_ROOM}`);
    console.log('📥 [SERVER] Data received:', JSON.stringify(data, null, 2));
    try {
      const validationResult = joinRoomSchema.safeParse(data);
      if (!validationResult.success) {
        console.error('❌ [SERVER] Validation failed for JOIN_ROOM:', validationResult.error.issues);
        socket.emit(WebRTCEvent.ERROR, {
          interviewId: (data as JoinRoomData).interviewId || 'unknown',
          error: Messages.WEBRTC.VALIDATION_FAILED,
          message: validationResult.error.issues.map(i => i.message).join(', '),
        });
        return;
      }

      const { interviewId, userId, role } = validationResult.data;
      console.log(`✅ [SERVER] Valid JOIN_ROOM: interviewId=${interviewId}, userId=${userId}, role=${role}`);

      let room = webrtcRooms.get(interviewId);
      if (!room) {
        room = {
          interviewId,
          participants: new Map(),
          createdAt: new Date(),
        };
        webrtcRooms.set(interviewId, room);
        console.log(`🆕 [SERVER] ${Messages.WEBRTC.ROOM_CREATED}: ${interviewId}`);
      }

      const existingParticipant = Array.from(room.participants.values())
        .find(p => p.userId === userId);
      
      if (existingParticipant) {
        console.log(`🔄 [SERVER] Removing existing participant with socket ${existingParticipant.socketId}`);
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

      console.log(`✅ [SERVER] ${Messages.WEBRTC.USER_JOINED}: ${userId} (${role}) - ${interviewId}`);
      console.log(`📊 [SERVER] Room now has ${room.participants.size} participant(s)`);

      const serializedRoom = serializeRoom(room);
      console.log(`📤 [SERVER] Emitting ROOM_JOINED to socket ${socket.id}`);
      socket.emit(WebRTCEvent.ROOM_JOINED, {
        interviewId,
        room: serializedRoom,
      });
      console.log('✅ [SERVER] ROOM_JOINED emitted successfully');

      // Notify existing participants about the new user, and notify new user about existing participants
      if (room.participants.size > 1) {
        console.log(`👥 [SERVER] Room has ${room.participants.size} participants, notifying peers...`);
        const participants = Array.from(room.participants.values());
        
        // Notify all existing participants about the new participant
        const newParticipant = participants.find(p => p.socketId === socket.id);
        if (newParticipant) {
          console.log(`📤 [SERVER] Emitting PEER_JOINED to room ${interviewId} about new participant ${newParticipant.userId}`);
          socket.to(interviewId).emit(WebRTCEvent.PEER_JOINED, {
            interviewId,
            peer: {
              userId: newParticipant.userId,
              role: newParticipant.role,
            },
          });
          console.log(`✅ [SERVER] ${Messages.WEBRTC.PEER_JOINED}: Notified others about new participant ${newParticipant.userId} (${newParticipant.role}) in room ${interviewId}`);
        }
        
        // Notify the new participant about all existing participants
        const existingParticipants = participants.filter(p => p.socketId !== socket.id);
        console.log(`📤 [SERVER] Notifying new participant about ${existingParticipants.length} existing participant(s)`);
        existingParticipants.forEach(existingParticipant => {
          console.log(`📤 [SERVER] Emitting PEER_JOINED to socket ${socket.id} about existing ${existingParticipant.userId}`);
          socket.emit(WebRTCEvent.PEER_JOINED, {
            interviewId,
            peer: {
              userId: existingParticipant.userId,
              role: existingParticipant.role,
            },
          });
          console.log(`✅ [SERVER] ${Messages.WEBRTC.PEER_JOINED}: Notified new participant about existing ${existingParticipant.userId} (${existingParticipant.role}) in room ${interviewId}`);
        });
      } else {
        console.log('⏳ [SERVER] Room has only 1 participant, waiting for peer to join...');
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in join-room handler:', errorMessage);
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

      console.log(`${Messages.WEBRTC.OFFER_FORWARDED} from ${fromUserId} to ${toUserId} in room ${interviewId}`);

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in offer handler:', errorMessage);
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
      console.error('Error in answer handler:', errorMessage);
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
    console.log(`${Messages.WEBRTC.USER_DISCONNECTED}: ${socket.id}`);

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
            console.log('Application shortlisted, creating conversation:', eventData.applicationId);
            
            const _chatService = container.get<IChatService>(TYPES.IChatService);
            
            const response = await axios.get(`${AppConfig.APPLICATION_SERVICE_URL}/api/applications/${eventData.applicationId}`);
            
            const { userId, companyId } = response.data.data || response.data;

            await _chatService.createConversationFromApplication(
              eventData.applicationId,
              userId,
              companyId,
            );
            
            console.log(`Conversation created for application: ${eventData.applicationId}`);
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error('Error processing Kafka event:', errorMessage);
        }
      },
    });

    console.log('Kafka consumer initialized for chat-service');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to initialize Kafka consumer:', errorMessage);
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
  console.log('Shutting down chat service...');
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