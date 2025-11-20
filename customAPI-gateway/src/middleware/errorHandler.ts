import { Request, Response, NextFunction } from 'express';
import { HttpStatusCode } from '@/enums/HttpStatusCode';
import { CommonMessages } from '@/constants/CommonMessages';

export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('API Gateway Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
    success: false,
    error: CommonMessages.INTERNAL_SERVER_ERROR,
    message: CommonMessages.SOMETHING_WENT_WRONG,
    timestamp: new Date().toISOString()
  });
};