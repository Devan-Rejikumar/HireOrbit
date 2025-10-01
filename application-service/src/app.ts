import express from 'express';
import cors from 'cors';
import { container } from './config/inversify.config';
import { IEventService } from './services/IEventService';
import applicationRoutes from './routes/ApplicationRoutes';
import {TYPES} from './config/types';
import { upload } from './config/cloudinary';

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
app.use('/api/applications/apply', upload.single('resume'));

// Debug logging middleware
app.use((req, res, next) => {
  console.log(`📨 [APP-SERVICE] ${req.method} ${req.url} - Body:`, req.body);
  next();
});

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    service: 'application-service',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/applications', applicationRoutes);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});


async function initializeServices(): Promise<void> {
  try {
    const eventService = container.get<IEventService>(TYPES.IEventService);
    await eventService.start();
    console.log('✅ Event service (Kafka) initialized successfully');
  } catch (error: any) {
    console.warn('⚠️ Failed to initialize event service (Kafka not available):', error.message);
    console.log('🔄 Continuing without Kafka - events will not be published');
  }
}

process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  try {
    const eventService = container.get<IEventService>(TYPES.IEventService);
    await eventService.stop();
    console.log('✅ Event service stopped');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  try {
    const eventService = container.get<IEventService>(TYPES.IEventService);
    await eventService.stop();
    console.log('✅ Event service stopped');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

export { app, initializeServices };