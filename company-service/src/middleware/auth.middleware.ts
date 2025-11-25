import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { buildErrorResponse } from 'shared-dto';
import { HttpStatusCode } from '../enums/StatusCodes';
import { logger } from '../utils/logger';
import { Messages } from '../constants/Messages';
import { AppConfig } from '../config/app.config';

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
      logger.debug('Token found in Authorization header');
    } else if (req.cookies.adminAccessToken) {
      token = req.cookies.adminAccessToken;
      logger.debug('Admin token found in cookies (fallback)');
    } else if (req.cookies.companyAccessToken) {
      token = req.cookies.companyAccessToken;
      logger.debug('Company token found in cookies (fallback)');
    } else if (req.cookies.accessToken) {
      token = req.cookies.accessToken;
      logger.debug('Generic access token found in cookies (fallback)');
    }
    
    if (!token) {
      logger.warn('No access token found in Authorization header or cookies');
      res.status(HttpStatusCode.UNAUTHORIZED).json(
        buildErrorResponse(Messages.ERROR.NO_TOKEN_PROVIDED, Messages.AUTH.AUTHENTICATION_REQUIRED)
      );
      return;
    }

    const jwtSecret = AppConfig.JWT_SECRET;
    logger.debug('Token found, verifying...');
    const decoded = jwt.verify(token, jwtSecret) as CompanyTokenPayload;
    
    logger.debug('Token verified successfully', { userId: decoded.userId, role: decoded.role });
    
    if (decoded.role !== 'company' && decoded.role !== 'admin') {
      logger.warn('Invalid token type', { expected: 'company or admin', got: decoded.role });
      res.status(HttpStatusCode.FORBIDDEN).json(
        buildErrorResponse(Messages.ERROR.INVALID_TOKEN_TYPE, Messages.ERROR.COMPANY_TOKEN_REQUIRED)
      );
      return;
    }

    const userId = decoded.userId;
    const companyId = decoded.companyId || decoded.userId;

    if (!userId) {
      logger.warn('No user ID found in token');
      res.status(HttpStatusCode.UNAUTHORIZED).json(
        buildErrorResponse(Messages.AUTH.COMPANY_NOT_AUTHENTICATED, Messages.AUTH.AUTHENTICATION_REQUIRED)
      );
      return;
    }
    
    req.user = {
      companyId: companyId,
      email: decoded.email,
      role: decoded.role,
      userType: decoded.userType
    };

    logger.debug('User context set', {
      userId: userId,
      companyId: companyId,
      email: decoded.email,
      role: decoded.role,
      userType: decoded.userType,
    });

    next();
  } catch (error) {
    logger.error('Token verification failed', { error: error instanceof Error ? error.message : 'Unknown error' });
    res.status(HttpStatusCode.UNAUTHORIZED).json(
      buildErrorResponse(Messages.ERROR.INVALID_TOKEN_TYPE, Messages.AUTH.AUTHENTICATION_REQUIRED)
    );
  }
};