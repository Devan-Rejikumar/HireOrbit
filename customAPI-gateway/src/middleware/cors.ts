import { Request, Response, NextFunction } from 'express';
import { env } from '@/config/env';
import { HttpStatusCode } from '@/enums/HttpStatusCode';

export const corsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  res.header('Access-Control-Allow-Origin', env.CORS_ORIGIN);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-user-id, x-user-email, x-user-role');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    res.status(HttpStatusCode.OK).end();
    return;
  }

  next();
};