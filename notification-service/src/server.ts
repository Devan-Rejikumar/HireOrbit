import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { container } from './config/inversify.config';
import { connectMongoDB } from './config/mongodb.config';
import { IEventService } from './services/interfaces/IEventService';
import { TYPES } from './config/types';
import notificationRoutes from './routes/NotificationRoutes';
import { EventService } from './services/implementations/EventService';


interface ApplicationCreatedEventData {
  companyId: string;
  applicationId: string;
  jobId: string;
  applicantName?: string;
  jobTitle?: string;
}

interface StatusUpdatedEventData {
  userId: string;
  applicationId: string;
  jobId: string;
  oldStatus: string;
  newStatus: string;
}

interface ApplicationWithdrawnEventData {
  companyId: string;
  applicationId: string;
  jobId: string;
  applicantName?: string;
  jobTitle?: string;
}

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

app.use('/api/notifications', notificationRoutes);
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'notification-service' });
});
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

async function initializeServices(): Promise<void> {
  try {
    await connectMongoDB();
    console.log('MongoDB connected successfully');

    const eventService = container.get<IEventService>(TYPES.IEventService);
    
    // Start the consumer
    await eventService.start();
    console.log('Event Service connected to Kafka');
    
    // Subscribe to topics
    await eventService.subscribe('application.created', async (data) => {
      console.log('Application created event received:', data);
      const eventServiceInstance = container.get<EventService>(TYPES.IEventService) as EventService;
      await eventServiceInstance.handleApplicationCreated(data as ApplicationCreatedEventData);
    });

    console.log('Event service (Kafka) initialized successfully');

  } catch (error: any) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  console.log('Shutting down notification service...');
  try {
    const eventService = container.get<IEventService>(TYPES.IEventService);
    await eventService.stop();
    console.log('Event service stopped');
  } catch (error) {
    console.error('Error stopping event service:', error);
  }
  process.exit(0);
});

export { app, server, io, initializeServices };