import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import userRoutes from './routes/UserRoutes';
import adminRoutes from './routes/AdminRoutes';
import profileRoutes from './routes/ProfileRoutes';
import { authenticateToken } from './middleware/auth';
import {logger} from './utils/logger';
import { register, httpRequestDuration, httpRequestCount } from './utils/metrics';

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
    res.status(500).end('Error generating metrics');
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

app.get('/test', (req, res) => {
  logger.info('Test route hit');
  res.json({ message: 'Server is working!' });
});

app.get('/test-auth', authenticateToken, (req, res) => {
  logger.info('Test auth route hit');
  res.json({ message: 'Auth test successful!', user: req.user });
});

app.get('/test-no-auth', (req, res) => {
  logger.info('Test no-auth route hit');
  res.json({ message: 'No auth test successful!', headers: req.headers });
});


app.use((err: any, req: any, res: any, next: any) => {
  logger.error('Global error handler:', { message: err.message, stack: err.stack });
  
  if (err.message === 'Invalid JSON') {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid JSON format',
      message: 'Request body must be valid JSON'
    });
  }
  
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ 
      success: false, 
      error: 'JSON parse error',
      message: 'Invalid JSON in request body'
    });
  }
  
  if (err.code === 'ECONNRESET' || err.message.includes('request aborted')) {
    logger.warn('Request aborted or connection reset');
    return;
  }
  
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error',
    message: 'An unexpected error occurred'
  });
});

export default app;
