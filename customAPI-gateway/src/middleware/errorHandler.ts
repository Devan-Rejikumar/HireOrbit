import { Request, Response, NextFunction } from 'express';
export const errorHandler = (error: Error,req: Request,res: Response,next: NextFunction): void => {
  console.error('API Gateway Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: 'Something went wrong on our end',
    timestamp: new Date().toISOString()
  });
};