import { Request, Response, NextFunction } from 'express';
import { userServiceProxy, userServiceMultipartProxy } from './userService';
import { companyServiceProxy } from './companyService';
import { jobServiceProxy } from './jobService';
import { applicationServiceProxy, applicationServiceMultipartProxy } from './applicationService';
import { notificationServiceProxy } from './notificationService';
import { chatServiceProxy } from './chatService';
import { subscriptionServiceProxy } from './subscriptionService';
import { SERVICE_ROUTES } from '../config/routes';
import { logger } from '../utils/logger';

export const createProxy = (req: Request, res: Response, next: NextFunction): void => {
  const path = req.originalUrl;

  if (path.startsWith(SERVICE_ROUTES.USERS)) {
    logger.debug('Routing to User Service', { path });
    
    const contentType = req.headers['content-type'];
    if (contentType && contentType.includes('multipart/form-data')) {
      userServiceMultipartProxy(req, res, next);
    } else {
      userServiceProxy(req, res, next);
    }
    
  } else if (path.startsWith(SERVICE_ROUTES.COMPANY)) {
    companyServiceProxy(req, res, next);
    
  } else if (path.startsWith(SERVICE_ROUTES.JOBS)) {
    jobServiceProxy(req, res, next);
    
  } else if (path.startsWith(SERVICE_ROUTES.APPLICATIONS)) {
    const contentType = req.headers['content-type'];
    if (contentType && contentType.includes('multipart/form-data')) {
      applicationServiceMultipartProxy(req, res, next);
    } else {
      applicationServiceProxy(req, res, next);
    }
    
  } else if (path.startsWith(SERVICE_ROUTES.INTERVIEWS)) {
    applicationServiceProxy(req, res, next);
    
  } else if (path.startsWith(SERVICE_ROUTES.OFFERS)) {
    logger.debug('Routing to Application Service for offers', { path });
    applicationServiceProxy(req, res, next);
    
  } else if (path.startsWith(SERVICE_ROUTES.NOTIFICATIONS)) {
    notificationServiceProxy(req, res, next);
    
  } else if (path.startsWith(SERVICE_ROUTES.CHAT)) {
    chatServiceProxy(req, res, next);
    
  } else if (path.startsWith(SERVICE_ROUTES.SUBSCRIPTIONS) || path.startsWith('/api/admin/subscriptions')) {
    logger.debug('Routing to Subscription Service', { path });
    subscriptionServiceProxy(req, res, next);
  } else if (path.startsWith('/api/industries')) {
    logger.debug('Routing to Company Service for industries', { path });
    companyServiceProxy(req, res, next);
  } else {
    userServiceProxy(req, res, next);
  }
};