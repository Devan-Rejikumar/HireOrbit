import { Request, Response, NextFunction } from 'express';
import { userServiceProxy, userServiceMultipartProxy } from './userService';
import { companyServiceProxy } from './companyService';
import { jobServiceProxy } from './jobService';
import { applicationServiceProxy, applicationServiceMultipartProxy } from './applicationService';
import { notificationServiceProxy } from './notificationService';
import { chatServiceProxy } from './chatService';
import { SERVICE_ROUTES } from '@/config/routes';

export const createProxy = (req: Request, res: Response, next: NextFunction): void => {
  const path = req.originalUrl;

  if (path.startsWith(SERVICE_ROUTES.USERS)) {
    console.log('Routing to User Service');
    
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
    
  } else if (path.startsWith(SERVICE_ROUTES.NOTIFICATIONS)) {
    notificationServiceProxy(req, res, next);
    
  } else if (path.startsWith(SERVICE_ROUTES.CHAT)) {
    chatServiceProxy(req, res, next);
    
  } else {
    userServiceProxy(req, res, next);
  }
};