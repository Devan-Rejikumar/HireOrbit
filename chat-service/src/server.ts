import 'reflect-metadata';
import { createServer } from 'http';
import { Server } from 'socket.io';
import axios from 'axios';
import { container } from './config/inversify.config';
import { connectMongoDB } from './config/mongodb.config';
import { consumer } from './config/kafka.config';
import { IChatService } from './services/interfaces/IChatService';
import { TYPES } from './config/types';
import { sendMessageSchema, markAsReadSchema, typingIndicatorSchema } from './dto/schemas/chat.schema';
import app from './app';

interface StatusUpdatedEventData {
  applicationId: string;
  oldStatus: string;
  newStatus: string;
  changedBy: string;
  reason?: string;
  updatedAt: Date;
}

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
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
          error: 'Validation failed', 
          details: errorDetails
        });
        return;
      }

      const _chatService = container.get<IChatService>(TYPES.IChatService);
      const message = await _chatService.sendMessage(
        validationResult.data.conversationId,
        validationResult.data.senderId,
        validationResult.data.content,
        validationResult.data.messageType || 'text'
      );
      
      io.to(validationResult.data.conversationId).emit('new-message', message);
    } catch (error) {
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
      isTyping: validationResult.data.isTyping
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
        validationResult.data.userId
      );
      io.to(validationResult.data.conversationId).emit('messages-read', {
        conversationId: validationResult.data.conversationId,
        userId: validationResult.data.userId
      });
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
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
            
            const applicationServiceUrl = process.env.APPLICATION_SERVICE_URL || 'http://localhost:3004';
            const response = await axios.get(`${applicationServiceUrl}/api/applications/${eventData.applicationId}`);
            
            const { userId, companyId } = response.data.data || response.data;

            await _chatService.createConversationFromApplication(
              eventData.applicationId,
              userId,
              companyId
            );
            
            console.log(`Conversation created for application: ${eventData.applicationId}`);
          }
        } catch (error) {
          console.error('Error processing Kafka event:', error);
        }
      }
    });

    console.log('Kafka consumer initialized for chat-service');
  } catch (error) {
    console.error('Failed to initialize Kafka consumer:', error);
  }
}

async function initializeServices(): Promise<void> {
  try {
    await connectMongoDB();
    console.log('MongoDB connected successfully');
    
    await initializeKafkaConsumer();
  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('Shutting down chat service...');
  try {
    await consumer.disconnect();
    console.log('Kafka consumer disconnected');
  } catch (error) {
    console.error('Error disconnecting Kafka consumer:', error);
  }
  process.exit(0);
});

export { server, io, initializeServices };