import { HttpStatusCode } from '@/enums/HttpStatusCode';
import { Request, Response, NextFunction } from 'express';
let metricsData = {
  requests: 0,
  errors: 0,
  startTime: Date.now()
};

export const getMetrics = (req: Request, res: Response, next: NextFunction): void => {
  const uptime = Date.now() - metricsData.startTime;
  
  const response = {
    requests: metricsData.requests,
    errors: metricsData.errors,
    uptime: uptime,
    requestsPerSecond: metricsData.requests / (uptime / 1000),
    errorRate: metricsData.errors / metricsData.requests || 0,
    timestamp: new Date().toISOString()
  };

  res.status(HttpStatusCode.OK).json(response);
};

export const incrementRequests = (): void => {
  metricsData.requests++;
};

export const incrementErrors = (): void => {
  metricsData.errors++;
};