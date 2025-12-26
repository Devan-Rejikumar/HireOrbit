import express from 'express';
import cors from 'cors';
import { container } from './config/inversify.config';
import { IEventService } from './services/interfaces/IEventService';
import applicationRoutes from './routes/ApplicationRoutes';
import interviewRoutes from './routes/InterviewRoutes';
import offerRoutes from './routes/OfferRoutes';
import atsRoutes from './routes/ATSRoutes';
import offerTemplateRoutes from './routes/OfferTemplateRoutes';
import { APPLICATION_ROUTES, INTERVIEW_ROUTES, OFFER_ROUTES, ATS_ROUTES, OFFER_TEMPLATE_ROUTES } from './constants/routes';
import { TYPES } from './config/types';
import { logger } from './utils/logger';
import { register, httpRequestDuration, httpRequestCount } from './utils/metrics';
import { ErrorHandler } from './middleware/error-handler.middleware';

const app = express();

import { AppConfig } from './config/app.config';

app.use(cors({
  origin: AppConfig.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-email', 'x-user-role'],
}));

// Body parsing middleware - skip for multipart/form-data (multer handles it)
app.use((req, res, next) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    return next(); // Skip body parsing for multipart, multer will handle it
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/uploads', express.static('uploads'));

app.use((req, res, next) => {
  const start = Date.now();
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    contentType: req.headers['content-type'],
  });
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode,
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
    timestamp: new Date().toISOString(),
  });
});

app.use(APPLICATION_ROUTES.API_BASE_PATH, applicationRoutes);
app.use(INTERVIEW_ROUTES.API_BASE_PATH, interviewRoutes);

// Debug: Log offer template routes registration
console.log('=== OFFER TEMPLATE ROUTES DEBUG ===');
console.log('Base path:', OFFER_TEMPLATE_ROUTES.API_BASE_PATH);
console.log('GET template route:', OFFER_TEMPLATE_ROUTES.GET_TEMPLATE);
console.log('Full route will be:', OFFER_TEMPLATE_ROUTES.API_BASE_PATH + OFFER_TEMPLATE_ROUTES.GET_TEMPLATE);
app.use(OFFER_TEMPLATE_ROUTES.API_BASE_PATH, (req, res, next) => {
  console.log(`[TEMPLATE MIDDLEWARE] ${req.method} ${req.originalUrl} - matched template base path`);
  next();
}, offerTemplateRoutes);

app.use(OFFER_ROUTES.API_BASE_PATH, (req, res, next) => {
  console.log(`[OFFER MIDDLEWARE] ${req.method} ${req.originalUrl} - matched offer base path`);
  next();
}, offerRoutes);
app.use(ATS_ROUTES.API_BASE_PATH, atsRoutes);

// Debug: Log registered routes
logger.info(`Registered offer routes at: ${OFFER_ROUTES.API_BASE_PATH}`);
logger.info(`  GET ${OFFER_ROUTES.GET_USER_OFFERS}`);
logger.info(`  GET ${OFFER_ROUTES.GET_COMPANY_OFFERS}`);
logger.info(`  GET ${OFFER_ROUTES.GET_OFFER_BY_ID}`);
logger.info(`Registered ATS routes at: ${ATS_ROUTES.API_BASE_PATH}`);
logger.info(`  POST ${ATS_ROUTES.ANALYZE_RESUME}`);
logger.info(`Registered Offer Template routes at: ${OFFER_TEMPLATE_ROUTES.API_BASE_PATH}`);
logger.info(`  GET ${OFFER_TEMPLATE_ROUTES.GET_TEMPLATE}`);
logger.info(`  POST/PUT ${OFFER_TEMPLATE_ROUTES.CREATE_OR_UPDATE_TEMPLATE}`);
logger.info(`  POST ${OFFER_TEMPLATE_ROUTES.UPLOAD_LOGO}`);
logger.info(`  POST ${OFFER_TEMPLATE_ROUTES.UPLOAD_SIGNATURE}`);
logger.info(`  POST ${OFFER_TEMPLATE_ROUTES.PREVIEW_TEMPLATE}`);

app.use(ErrorHandler);

async function initializeServices(): Promise<void> {
  try {
    logger.info('Initializing Kafka event service...');
    const _eventService = container.get<IEventService>(TYPES.IEventService);
    await _eventService.start();
    logger.info('Event service (Kafka) initialized successfully');
  } catch (error: unknown) {
    const err = error as { message?: string; stack?: string };
    logger.error('Failed to initialize event service (Kafka):', err.message);
    logger.error('Error stack:', err.stack);
    logger.warn('Continuing without Kafka - events will not be published reliably');
    logger.warn('Make sure Kafka is running at the configured broker address');
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