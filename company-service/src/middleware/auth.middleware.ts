import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { buildErrorResponse } from 'shared-dto';
import { HttpStatusCode } from '../enums/StatusCodes';

declare global {
  namespace Express {
    interface Request {
      cookies?: { [key: string]: string };
    }
  }
}

interface CompanyTokenPayload extends JwtPayload {
  userId: string;  
  companyId?: string;  
  email: string;
  role: string;
  userType: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    companyId: string;  
    email: string;
    role: string;
    userType: string;
  };
}

export const authenticateCompany = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {

    let token: string | undefined;
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); 
      console.log('🔍 [COMPANY-AUTH-MIDDLEWARE] Token found in Authorization header');
    } else if (req.cookies.adminAccessToken) {
      token = req.cookies.adminAccessToken;
      console.log('🔍 [COMPANY-AUTH-MIDDLEWARE] Admin token found in cookies (fallback)');
    } else if (req.cookies.companyAccessToken) {
      token = req.cookies.companyAccessToken;
      console.log('🔍 [COMPANY-AUTH-MIDDLEWARE] Company token found in cookies (fallback)');
    }
    
    if (!token) {
      console.log('❌ [COMPANY-AUTH-MIDDLEWARE] No access token found in Authorization header or cookies');
      res.status(HttpStatusCode.UNAUTHORIZED).json(buildErrorResponse('No token provided', 'Authentication required'));
      return;
    }

    const jwtSecret = process.env.JWT_SECRET || 'supersecret';
    console.log('🔍 [COMPANY-AUTH-MIDDLEWARE] Token found, verifying...');
    const decoded = jwt.verify(token, jwtSecret) as CompanyTokenPayload;
    
    console.log('✅ [COMPANY-AUTH-MIDDLEWARE] Token verified successfully:', decoded);
    
    if (decoded.role !== 'company' && decoded.role !== 'admin') {
      console.log('❌ [COMPANY-AUTH-MIDDLEWARE] Invalid token type, expected company or admin, got:', decoded.role);
      res.status(HttpStatusCode.FORBIDDEN).json(buildErrorResponse('Invalid token type', 'Company or admin token required'));
      return;
    }

    const userId = decoded.userId;
    const companyId = decoded.companyId || decoded.userId;

    if (!userId) {
      console.log('❌ [COMPANY-AUTH-MIDDLEWARE] No user ID found in token');
      res.status(HttpStatusCode.UNAUTHORIZED).json(buildErrorResponse('User not authenticated', 'Authentication required'));
      return;
    }
    
    req.user = {
      companyId: companyId,
      email: decoded.email,
      role: decoded.role,
      userType: decoded.userType
    };

    console.log('✅ [COMPANY-AUTH-MIDDLEWARE] User context set:', {
      userId: userId,
      companyId: companyId,
      email: decoded.email,
      role: decoded.role,
      userType: decoded.userType,
      hasCompanyId: !!decoded.companyId
    });

    next();
  } catch (error) {
    console.error('❌ [COMPANY-AUTH-MIDDLEWARE] Token verification failed:', error);
    res.status(HttpStatusCode.UNAUTHORIZED).json(buildErrorResponse('Invalid token', 'Authentication failed'));
  }
};