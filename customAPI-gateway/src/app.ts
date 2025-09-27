import express from 'express';
import { Authenticate, RequireUser, RequireCompany, RequireAdmin } from '@/middleware/auth';
import { corsMiddleware } from '@/middleware/cors';
import { rateLimiterMiddleware } from '@/middleware/rateLimiter';
import { errorHandler } from '@/middleware/errorHandler';
import { loggerMiddleware } from '@/middleware/logger';
import { createProxy } from '@/proxy/loadBalancer';
import { healthCheck } from '@/monitoring/healthCheck';
import { getMetrics } from '@/monitoring/metrics';
import { routeHandler } from './middleware/routeHandler';

const app = express();

app.use(corsMiddleware);
app.use(loggerMiddleware);
app.use(rateLimiterMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.get('/health', healthCheck);
app.get('/metrics', getMetrics);
app.use('/api/*', (req, res, next) => {
    console.log('🚀 ===== API GATEWAY REQUEST =====');
    console.log('🚀 Method:', req.method);
    console.log('🚀 Path:', req.path);
    console.log('🚀 URL:', req.url);
    console.log('🚀 Original URL:', req.originalUrl);
    console.log('🚀 Base URL:', req.baseUrl);
    console.log('🚀 Headers:', JSON.stringify(req.headers, null, 2));
    console.log('🚀 Body:', req.body);
    console.log('🚀 ================================');
    console.log('🚀 [GATEWAY] About to call routeHandler...');
    routeHandler(req, res, next);
    console.log('🚀 [GATEWAY] routeHandler call completed');
});
app.use(errorHandler);

export default app;