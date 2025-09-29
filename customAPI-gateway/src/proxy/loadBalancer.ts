import { Request, Response, NextFunction } from 'express';
import { userServiceProxy, userServiceMultipartProxy } from './userService';
import { companyServiceProxy } from './companyService';
import { jobServiceProxy } from './jobService';
import { applicationServiceProxy } from './applicationService';

export const createProxy = (req: Request, res: Response, next: NextFunction): void => {
  const path = req.originalUrl;

  if (path.startsWith('/api/users')) {
    console.log('🔀 Routing to User Service');
    
    const contentType = req.headers['content-type'];
    if (contentType && contentType.includes('multipart/form-data')) {
      console.log('🔀 Using multipart proxy for file uploads');
      userServiceMultipartProxy(req, res, next);
    } else {
      console.log('🔀 Using regular proxy for JSON requests');
      userServiceProxy(req, res, next);
    }
    
  } else if (path.startsWith('/api/company')) {
    console.log('🔀 Routing to Company Service');
    console.log('🔀 [LOAD BALANCER] About to call companyServiceProxy...');
    companyServiceProxy(req, res, next);
  } else if (path.startsWith('/api/jobs')) {
    console.log('🔀 Routing to Job Service');
    console.log('🔀 [LOAD BALANCER] About to call jobServiceProxy...');
    jobServiceProxy(req, res, next);
  } else if (path.startsWith('/api/applications')) {
    console.log('🔀 Routing to Application Service');
    console.log('🔀 [LOAD BALANCER] About to call applicationServiceProxy...');
    applicationServiceProxy(req, res, next);
  } else {
    console.log('🔀 Default routing to User Service');
    console.log('🔀 [LOAD BALANCER] About to call userServiceProxy (default)...');
    userServiceProxy(req, res, next);
  }
};