import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { HttpStatusCode } from '../enums/HttpStatusCode';
import { CommonMessages } from '../constants/CommonMessages';

const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const clientId = req.ip || 'unknown';
  const now = Date.now();
  const rateLimitWindowMs = env.RATE_LIMIT_WINDOW_MS;
  const rateLimitMaxRequests = env.RATE_LIMIT_MAX_REQUESTS;

  let clientData = requestCounts.get(clientId);
  
  if (!clientData || now > clientData.resetTime) {
    clientData = {
      count: 0,
      resetTime: now + rateLimitWindowMs
    };
    requestCounts.set(clientId, clientData);
  }
  clientData.count++;
  
  if (clientData.count > rateLimitMaxRequests) {
    res.status(HttpStatusCode.TOO_MANY_REQUESTS).json({
      success: false,
      error: 'Too many requests',
      message: `Rate limit exceeded. Max ${rateLimitMaxRequests} requests per ${rateLimitWindowMs / 1000} seconds`,
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
    return;
  }
  
  res.header('X-RateLimit-Limit', rateLimitMaxRequests.toString());
  res.header('X-RateLimit-Remaining', (rateLimitMaxRequests - clientData.count).toString());
  res.header('X-RateLimit-Reset', new Date(clientData.resetTime).toISOString());
  
  next();
};

