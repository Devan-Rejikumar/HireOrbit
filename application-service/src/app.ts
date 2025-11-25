import express from 'express';
import cors from 'cors';
import { container } from './config/inversify.config';
import { IEventService } from './services/interface/IEventService';
import applicationRoutes from './routes/ApplicationRoutes';
import interviewRoutes from './routes/InterviewRoutes';
import {TYPES} from './config/types';
import { logger } from './utils/logger';
import { register, httpRequestDuration, httpRequestCount } from './utils/metrics';
import { ErrorHandler } from './middleware/error-handler.middleware';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-email', 'x-user-role'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static('uploads'));

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

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'application-service',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/applications', applicationRoutes);
app.use('/api/interviews', interviewRoutes);


app.use(ErrorHandler);


async function initializeServices(): Promise<void> {
  try {
    const _eventService = container.get<IEventService>(TYPES.IEventService);
    await _eventService.start();
    logger.info('Event service (Kafka) initialized successfully');
  } catch (error: any) {
    logger.warn('Failed to initialize event service (Kafka not available):', error.message);
    logger.info('Continuing without Kafka - events will not be published');
  }
}

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  try {
    const _eventService = container.get<IEventService>(TYPES.IEventService);
    await _eventService.stop();
    logger.info('Event service stopped');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  try {
    const _eventService = container.get<IEventService>(TYPES.IEventService);
    await _eventService.stop();
    logger.info('Event service stopped');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
});

export { app, initializeServices };