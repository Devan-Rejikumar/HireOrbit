import express from 'express';
import { Authenticate, RequireUser, RequireCompany, RequireAdmin } from '@/middleware/auth';
import { corsMiddleware } from '@/middleware/cors';
import { rateLimiterMiddleware } from '@/middleware/rateLimiter';
import { errorHandler } from '@/middleware/errorHandler';
import { createProxy } from '@/proxy/loadBalancer';
import { healthCheck } from '@/monitoring/healthCheck';
import { routeHandler } from './middleware/routeHandler';
import { logger } from './utils/logger';
import { register, httpRequestDuration, httpRequestCount } from './utils/metrics';

const app = express();

app.use(corsMiddleware);
app.use(rateLimiterMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


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
      status: res.statusCode,
      service: 'api-gateway'
    };
    
    httpRequestDuration.observe(labels, duration);
    httpRequestCount.inc(labels);
    
    logger.info(`Request completed: ${labels.method} ${labels.route} ${labels.status} (${duration.toFixed(3)}s)`);
  });
  
  next();
});

app.get('/health', healthCheck);
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Error generating metrics:', error);
    res.status(500).end('Error generating metrics');
  }
});
app.use('/api/*', (req, res, next) => {
    logger.info('API Gateway Request', {
      method: req.method,
      path: req.path,
      url: req.url,
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl
    });
    routeHandler(req, res, next);
});
app.use(errorHandler);

export default app;