import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/request';

export const extractUserFromHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthenticatedRequest;
  const headerUserId = req.headers['x-user-id'] as string;
  const userRole = req.headers['x-user-role'] as string;
  const userEmail = req.headers['x-user-email'] as string;
  if (headerUserId) {
    const isCompany = userRole === 'company';
    
    authReq.user = {
      userId: isCompany ? undefined : headerUserId,
      companyId: isCompany ? headerUserId : undefined,
      role: userRole
    };
    
    console.log('AuthMiddleware] User extracted from headers:', {
      headerUserId,
      userId: isCompany ? undefined : headerUserId,
      companyId: isCompany ? headerUserId : undefined,
      role: userRole,
      email: userEmail
    });
  }
  
  next();
};

