import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import './types/express';
import jobRoutes from './routes/JobRoutes';
import { logger } from './utils/logger';
import { register, httpRequestDuration, httpRequestCount } from './utils/metrics';
import { ErrorHandler } from './middleware/error-handler.middleware';
import { AppConfig } from './config/app.config';

dotenv.config();

const app = express();

app.use(cors({
  origin: AppConfig.FRONTEND_URL, 
  credentials: true,
}));
app.use(express.json({ limit: `${AppConfig.JSON_BODY_SIZE_LIMIT_MB}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${AppConfig.URL_ENCODED_BODY_SIZE_LIMIT_MB}mb` }));
app.use(cookieParser());

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
  res.json({ message: 'Job Service is running!' });
});

app.use('/api/jobs', jobRoutes);

app.use(ErrorHandler);

export default app;
