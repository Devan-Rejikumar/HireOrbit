import { Request, Response, NextFunction } from 'express';
export const loggerMiddleware = (req: Request,res: Response,next: NextFunction): void => {
  const start = Date.now();
  console.log(`${req.method} ${req.url} - ${new Date().toISOString()}`);
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};