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
import { logger } from './utils/logger';
import { register, httpRequestDuration, httpRequestCount } from './utils/metrics';
import { AppConfig } from './config/app.config';
import { NOTIFICATION_ROUTES } from './constants/routes';
import { ErrorHandler } from './middleware/error-handler.middleware';
import {
  ApplicationCreatedEventData,
  StatusUpdatedEventData,
  InterviewConfirmedEventData,
  InterviewDecisionEventData,
  ApplicationWithdrawnEventData
} from './types/events';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: AppConfig.FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});

app.use(helmet());

app.use(cors({
  origin: AppConfig.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-email', 'x-user-role']
}));
app.use(morgan('combined'));
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    contentType: req.headers['content-type']
  });
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode
    };
    
    httpRequestDuration.observe(labels, duration);
    httpRequestCount.inc(labels);
    
    logger.info(`Request completed: ${labels.method} ${labels.route} ${labels.status} (${duration.toFixed(3)}s)`);
  });
  
  next();
});

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Error generating metrics:', error);
    res.status(500).end('Error generating metrics');
  }
});

app.use(NOTIFICATION_ROUTES.API_BASE_PATH, notificationRoutes);
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'notification-service' });
});

app.use(ErrorHandler);
io.on('connection', (socket) => {
  logger.info('User connected:', { socketId: socket.id });
  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    logger.info(`User ${socket.id} joined room: ${roomId}`);
  });

  socket.on('disconnect', () => {
    logger.info('User disconnected:', { socketId: socket.id });
  });
});

async function initializeServices(): Promise<void> {
  try {
    await connectMongoDB();
    logger.info('MongoDB connected successfully');

    const _eventService = container.get<IEventService>(TYPES.IEventService);
    
    await _eventService.start();
    logger.info('Event Service connected to Kafka');
    await _eventService.subscribe('application.created', async (data) => {
      logger.info('Application created event received:', data);
      const eventServiceInstance = container.get<EventService>(TYPES.IEventService) as EventService;
      await eventServiceInstance.handleApplicationCreated(data as ApplicationCreatedEventData);
    });

    await _eventService.subscribe('application.status_updated', async (data) => {
      logger.info('Application status updated event received:', data);
      const eventServiceInstance = container.get<EventService>(TYPES.IEventService) as EventService;
      await eventServiceInstance.handleStatusUpdated(data as StatusUpdatedEventData);
    });

    await _eventService.subscribe('interview.confirmed', async (data) => {
      logger.info('Interview confirmed event received:', data);
      const eventServiceInstance = container.get<EventService>(TYPES.IEventService) as EventService;
      await eventServiceInstance.handleInterviewConfirmed(data as InterviewConfirmedEventData);
    });

    await _eventService.subscribe('interview.decision_made', async (data) => {
      logger.info('Interview decision made event received:', data);
      const eventServiceInstance = container.get<EventService>(TYPES.IEventService) as EventService;
      await eventServiceInstance.handleInterviewDecision(data as InterviewDecisionEventData);
    });

    const eventServiceInstance = _eventService as EventService;
    await eventServiceInstance.startConsumer();

    logger.info('Event service (Kafka) initialized successfully');

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to initialize services:', errorMessage);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('Shutting down notification service...');
  try {
    const _eventService = container.get<IEventService>(TYPES.IEventService);
    await _eventService.stop();
    logger.info('Event service stopped');
  } catch (error) {
    logger.error('Error stopping event service:', error);
  }
  process.exit(0);
});

export { app, server, io, initializeServices };