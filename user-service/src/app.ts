import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import './types/express';
import userRoutes from './routes/UserRoutes';
import adminRoutes from './routes/AdminRoutes';
import profileRoutes from './routes/ProfileRoutes';
import { authenticateToken } from './middleware/auth';
import {logger} from './utils/logger';
import { register, httpRequestDuration, httpRequestCount } from './utils/metrics';
import { HttpStatusCode } from './enums/StatusCodes';
import { Request, Response, NextFunction } from 'express';
import { Messages } from './constants/Messages';
import { ErrorHandler } from './middleware/errorHandler';

const app = express();

app.use((req, res, next) => {
  if (req.headers['content-type']?.includes('application/json, application/json')) {
    req.headers['content-type'] = 'application/json';
    logger.warn('Fixed malformed Content-Type header');
  }

  if (req.headers['content-type']?.includes('application/json') && 
      req.headers['content-type']?.includes('multipart/form-data')) {
    req.headers['content-type'] = 'application/json';
    logger.warn('Fixed mixed Content-Type header to application/json');
  }
  next();
});

app.use(express.json({ 
  limit: '20mb',
  verify: (req, res, buf, encoding) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      logger.error('Invalid JSON received');
      throw new Error('Invalid JSON');
    }
  }
}));

app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(cookieParser());


app.use((req, res, next) => {
  req.on('aborted', () => {
    logger.warn(`Request aborted for: ${req.url}`);
  });
  
  req.on('close', () => {
    logger.warn(`Request closed for: ${req.url}`);
  });
  
  next();
});

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);


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
    res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).end('Error generating metrics');
  }
});


app.use('/api/users', userRoutes);
app.use('/api/users/admin', adminRoutes);
app.use('/api/profile', profileRoutes);


logger.info('=== ROUTES REGISTERED ===');
logger.info('User routes: /api/users');
logger.info('Admin routes: /api/users/admin');
logger.info('Profile routes: /api/profile');
logger.info('========================');


// Global error handler (must be last)
app.use(ErrorHandler);

export default app;