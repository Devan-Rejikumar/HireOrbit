import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { HttpStatusCode } from '../enums/HttpStatusCode';
import { CommonMessages } from '../constants/CommonMessages';

export const healthCheck = (req: Request, res: Response, next: NextFunction): void => {
  const health = {
    status: CommonMessages.HEALTHY,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services: {
      user: env.USER_SERVICE_URL,
      company: env.COMPANY_SERVICE_URL,
      job: env.JOB_SERVICE_URL,
      application: env.APPLICATION_SERVICE_URL,
      notification: env.NOTIFICATION_SERVICE_URL,
      chat: env.CHAT_SERVICE_URL
    }
  };

  res.status(HttpStatusCode.OK).json(health);
};