import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import chatRoutes from './routes/ChatRoutes';
import { HttpStatusCode } from './enums/StatusCodes';
import { extractUserFromHeaders } from './middleware/auth.middleware';
import { logger } from './utils/logger';
import { register, httpRequestDuration, httpRequestCount } from './utils/metrics';
import { AppConfig } from './config/app.config';
import { CHAT_ROUTES } from './constants/routes';
import { ErrorHandler } from './middleware/error-handler.middleware';

const app = express();

app.use(helmet());
app.use(cors({
  origin: AppConfig.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id', 'x-user-email', 'x-user-role'],
}));
app.use(morgan('combined'));
app.use(express.json());
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error generating metrics:', errorMessage);
    res.status(500).end('Error generating metrics');
  }
});
app.use(CHAT_ROUTES.API_BASE_PATH, extractUserFromHeaders);

app.use(CHAT_ROUTES.API_BASE_PATH, chatRoutes);

app.get('/health', (req, res) => {
  res.status(HttpStatusCode.OK).json({ status: 'OK', service: 'chat-service' });
});

app.use(ErrorHandler);

export default app;