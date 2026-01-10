import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { HttpStatusCode } from '../enums/HttpStatusCode';
import { RequestWithUser } from '../types/express/RequestWithUser';
import { CommonMessages } from '../constants/CommonMessages';
import { AppConfig } from '../config/env';


const USER_ID_HEADER = 'x-user-id';
const USER_EMAIL_HEADER = 'x-user-email';
const USER_ROLE_HEADER = 'x-user-role';

/**
 * Extracts JWT token from request cookies or Authorization header
 * All roles now use unified accessToken cookie
 */
const extractToken = (req: Request): string | null => {
  if (req.cookies) {
    const tokenFromCookie = req.cookies.accessToken;
    if (tokenFromCookie) {
      return tokenFromCookie;
    }
  } else {
    console.log('[AUTH] req.cookies is undefined - cookie-parser may not be configured');
  }

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

/**
 * Creates an unauthorized response object
 */
const createUnauthorizedResponse = (message: string) => ({
  success: false,
  error: CommonMessages.UNAUTHORIZED,
  message
});

/**
 * Main authentication middleware - Verifies JWT token and sets user info
 * This is the primary authentication middleware used by the API Gateway
 */
export const Authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const token = extractToken(req);

  if (!token) {
    res.status(HttpStatusCode.UNAUTHORIZED).json(
      createUnauthorizedResponse('No token provided')
    );
    return;
  }

  try {
    const decoded = jwt.verify(
  token,
  AppConfig.auth.jwtSecret
) as { userId: string; email: string; role: string };

    const authReq = req as RequestWithUser;
    authReq.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      userType: decoded.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(HttpStatusCode.UNAUTHORIZED).json(
        createUnauthorizedResponse('Token expired')
      );
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(HttpStatusCode.UNAUTHORIZED).json(
        createUnauthorizedResponse('Invalid token')
      );
    } else {
      res.status(HttpStatusCode.UNAUTHORIZED).json(
        createUnauthorizedResponse('Authentication failed')
      );
    }
  }
};

/**
 * Middleware to require user role (jobseeker)
 */
export const RequireUser = (req: Request, res: Response, next: NextFunction): void => {
  Authenticate(req, res, () => {
    const authReq = req as RequestWithUser;
    if (authReq.user?.role !== 'jobseeker') {
      res.status(HttpStatusCode.FORBIDDEN).json(
        createUnauthorizedResponse('Access denied. User role required.')
      );
      return;
    }
    next();
  });
};

/**
 * Middleware to require company role
 */
export const RequireCompany = (req: Request, res: Response, next: NextFunction): void => {
  Authenticate(req, res, () => {
    const authReq = req as RequestWithUser;
    if (authReq.user?.role !== 'company') {
      res.status(HttpStatusCode.FORBIDDEN).json(
        createUnauthorizedResponse('Access denied. Company role required.')
      );
      return;
    }
    next();
  });
};

/**
 * Middleware to require admin role
 */
export const RequireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  Authenticate(req, res, () => {
    const authReq = req as RequestWithUser;
    if (authReq.user?.role !== 'admin') {
      res.status(HttpStatusCode.FORBIDDEN).json(
        createUnauthorizedResponse('Access denied. Admin role required.')
      );
      return;
    }
    next();
  });
};

/**
 * Extracts user information from request headers set by API Gateway
 * These headers are set by the gateway after verifying JWT token
 */
const extractUserFromHeaders = (req: Request): { userId: string; email: string; role: string } | null => {
  const userId = req.headers[USER_ID_HEADER] as string;
  const userEmail = req.headers[USER_EMAIL_HEADER] as string;
  const userRole = req.headers[USER_ROLE_HEADER] as string;

  if (!userId) {
    return null;
  }

  return { userId, email: userEmail, role: userRole };
};

/**
 * Middleware to validate user headers from API Gateway
 * 
 * This middleware:
 * - Validates that user headers exist (ensures request came through API Gateway)
 * - Attaches user information to req.user for use in controllers
 * 
 * Note: Token verification and blocked status check are handled by API Gateway.
 * This middleware only validates the presence of verified headers.
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userInfo = extractUserFromHeaders(req);
  if (!userInfo) {
    res.status(HttpStatusCode.UNAUTHORIZED).json(
      createUnauthorizedResponse('User identification required. Request must go through API Gateway.')
    );
    return;
  }

  const { userId, email, role } = userInfo;
  const authReq = req as RequestWithUser;
  authReq.user = {
    userId,
    email,
    role,
    userType: role
  };

  next();
};

