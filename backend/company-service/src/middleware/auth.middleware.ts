import { Request, Response, NextFunction } from 'express';
import { buildErrorResponse } from 'hireorbit-shared-dto';
import { HttpStatusCode } from '../enums/StatusCodes';
import { Messages } from '../constants/Messages';

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
  error: Messages.AUTH.AUTHENTICATION_REQUIRED,
  message
});

export interface AuthenticatedRequest extends Request {
  user?: {
    companyId: string;  
    email: string;
    role: string;
    userType: string;
  };
}

/**
 * Middleware to validate user headers from API Gateway
 * 
 * This middleware:
 * - Validates that user headers exist (ensures request came through API Gateway)
 * - Attaches user information to req.user for use in controllers
 * - Validates that role is 'company' or 'admin'
 * 
 * Note: Token verification and blocked status check are handled by API Gateway.
 * This middleware only validates the presence of verified headers.
 */
export const authenticateCompany = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const userInfo = extractUserFromHeaders(req);

  // Trust boundary: Ensure request came through API Gateway
  if (!userInfo) {
    res.status(HttpStatusCode.UNAUTHORIZED).json(
      createUnauthorizedResponse('User identification required. Request must go through API Gateway.')
    );
    return;
  }

  const { userId, email, role } = userInfo;

  // Validate role is company or admin
  if (role !== 'company' && role !== 'admin') {
    res.status(HttpStatusCode.FORBIDDEN).json(
      buildErrorResponse(Messages.ERROR.INVALID_TOKEN_TYPE, Messages.ERROR.COMPANY_TOKEN_REQUIRED),
    );
    return;
  }

  const companyId = userId; // For company users, userId is the companyId

  req.user = {
    companyId: companyId,
    email: email,
    role: role,
    userType: role,
  };

  next();
};