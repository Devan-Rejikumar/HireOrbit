import { Request, Response, NextFunction } from 'express';
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX_REQUESTS = 100;

const requestCounts = new Map<string, { count: number; resetTime: number }>();
export const rateLimiterMiddleware = (req: Request,res: Response, next: NextFunction): void => {
  const clientId = req.ip || 'unknown';
  const now = Date.now();

  let clientData = requestCounts.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    clientData = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    };
    requestCounts.set(clientId, clientData);
  }
  clientData.count++;
  if (clientData.count > RATE_LIMIT_MAX_REQUESTS) {
    res.status(429).json({
      success: false,
      error: 'Too many requests',
      message: `Rate limit exceeded. Max ${RATE_LIMIT_MAX_REQUESTS} requests per ${RATE_LIMIT_WINDOW_MS / 1000} seconds`,
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
    return;
  }
  res.header('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS.toString());
  res.header('X-RateLimit-Remaining', (RATE_LIMIT_MAX_REQUESTS - clientData.count).toString());
  res.header('X-RateLimit-Reset', new Date(clientData.resetTime).toISOString());
  
  next();
};