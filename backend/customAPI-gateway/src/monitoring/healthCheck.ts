import { Request, Response, NextFunction } from 'express';
import { AppConfig } from '../config/env';
import { HttpStatusCode } from '../enums/HttpStatusCode';
import { CommonMessages } from '../constants/CommonMessages';

export const healthCheck = (req: Request, res: Response, next: NextFunction): void => {
  const health = {
    status: CommonMessages.HEALTHY,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    services:{
  user: AppConfig.services.user,
  company: AppConfig.services.company,
  job: AppConfig.services.job,
  application: AppConfig.services.application,
  notification: AppConfig.services.notification,
  chat: AppConfig.services.chat,
}
  };

  res.status(HttpStatusCode.OK).json(health);
};