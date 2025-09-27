import { Request, Response, NextFunction } from 'express';
export const healthCheck = (req: Request, res: Response, next: NextFunction): void => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      user: 'http://localhost:3000',
      company: 'http://localhost:3001',
      job: 'http://localhost:3002',
      application: 'http://localhost:3004'
    }
  };

  res.status(200).json(health);
};