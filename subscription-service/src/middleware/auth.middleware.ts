import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/request';
import { HttpStatusCode } from '../enums/StatusCodes';
import { buildErrorResponse } from 'shared-dto';

/**
 * Middleware to extract user information from API Gateway headers
 * 
 * API Gateway forwards user information via headers:
 * - x-user-id: User or Company ID
 * - x-user-role: User role (jobseeker, company, admin)
 * - x-user-email: User email
 * 
 * This middleware:
 * - Extracts user info from headers
 * - Populates req.user for use in controllers
 * - Allows requests to continue even if no user info (for public endpoints)
 */
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
      role: userRole,
      email: userEmail
    };
  }
  
  next();
};

/**
 * Middleware to require authentication
 * 
 * Use this for protected routes that require a logged-in user
 */
export const requireAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthenticatedRequest;
  
  if (!authReq.user || (!authReq.user.userId && !authReq.user.companyId)) {
    res.status(HttpStatusCode.UNAUTHORIZED).json(
      buildErrorResponse('Authentication required', 'User authentication is required to access this resource')
    );
    return;
  }
  
  next();
};

/**
 * Middleware to require admin authentication
 * 
 * Use this for admin-only routes
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthenticatedRequest;
  
  if (!authReq.user || authReq.user.role !== 'admin') {
    res.status(HttpStatusCode.FORBIDDEN).json(
      buildErrorResponse('Admin access required', 'Admin privileges are required to access this resource')
    );
    return;
  }
  
  next();
};

