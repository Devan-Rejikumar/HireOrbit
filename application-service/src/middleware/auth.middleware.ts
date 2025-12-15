import { Request, Response, NextFunction } from 'express';
import { HttpStatusCode } from '../enums/StatusCodes';
import { Messages } from '../constants/Messages';
import { RequestWithUser } from '../types/express/RequestWithUser';

const USER_ID_HEADER = 'x-user-id';
const USER_EMAIL_HEADER = 'x-user-email';
const USER_ROLE_HEADER = 'x-user-role';

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
 * Creates an unauthorized response object
 */
const createUnauthorizedResponse = (message: string) => ({
  success: false,
  error: Messages.VALIDATION.AUTHENTICATION_REQUIRED,
  message,
});

/**
 * Middleware to validate user headers from API Gateway
 * 
 * This middleware:
 * - Validates that user headers exist (ensures request came through API Gateway)
 * - Attaches user information to req.user for use in controllers
 * 
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const userInfo = extractUserFromHeaders(req);
  if (!userInfo) {
    res.status(HttpStatusCode.UNAUTHORIZED).json(
      createUnauthorizedResponse('User identification required. Request must go through API Gateway.'),
    );
    return;
  }

  const { userId, email, role } = userInfo;
  (req as RequestWithUser).user = {
    userId,
    email,
    role,
    userType: role,
  };

  next();
};

