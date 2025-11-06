import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/request';

/**
 * Middleware to extract user information from headers forwarded by API Gateway
 * and populate req.user for authenticated requests
 */
export const extractUserFromHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthenticatedRequest;
  
  // Extract user info from headers (forwarded by API Gateway)
  const headerUserId = req.headers['x-user-id'] as string;
  const userRole = req.headers['x-user-role'] as string;
  const userEmail = req.headers['x-user-email'] as string;
  
  // Populate req.user if we have user information
  // The x-user-id header contains the actual ID (userId for jobseekers, companyId for companies)
  if (headerUserId) {
    const isCompany = userRole === 'company';
    
    authReq.user = {
      userId: isCompany ? undefined : headerUserId,
      companyId: isCompany ? headerUserId : undefined,
      role: userRole
    };
    
    console.log('🔐 [AuthMiddleware] User extracted from headers:', {
      headerUserId,
      userId: isCompany ? undefined : headerUserId,
      companyId: isCompany ? headerUserId : undefined,
      role: userRole,
      email: userEmail
    });
  }
  
  next();
};

