import { Request, Response, NextFunction } from 'express';
import { env } from '@/config/env';
import { HttpStatusCode } from '@/enums/HttpStatusCode';

const ALLOWED_METHODS = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';
const ALLOWED_HEADERS = 'Content-Type, Authorization';

export const corsMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  res.header('Access-Control-Allow-Origin', env.CORS_ORIGIN);
  res.header('Access-Control-Allow-Methods', ALLOWED_METHODS);
  res.header('Access-Control-Allow-Headers', ALLOWED_HEADERS);
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(HttpStatusCode.OK).end();
    return;
  }

  next();
};

