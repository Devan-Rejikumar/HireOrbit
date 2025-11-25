import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import companyRoutes from './routes/CompanyRoutes';
import { logger } from './utils/logger';
import { register, httpRequestDuration, httpRequestCount } from './utils/metrics';
import { ErrorHandler } from './middleware/error-handler.middleware';

dotenv.config();

const app = express();

app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  console.log(`App Body parsing middleware - Content-Type: ${req.headers['content-type']}`);
  next();
});

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
  credentials: true,
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Metrics and logging middleware
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
  res.json({ message: 'Company Service is running!' });
});

app.use('/api/company', companyRoutes);

// Global error handler (must be last)
app.use(ErrorHandler);

export default app; 