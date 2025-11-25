import { Response, NextFunction } from 'express';
import { HttpStatusCode } from '../enums/StatusCodes';
import { logger } from '../utils/logger';
import { RequestWithUser } from '../types/express/RequestWithUser';

const USER_ID_HEADER = 'x-user-id';
const USER_EMAIL_HEADER = 'x-user-email';
const USER_ROLE_HEADER = 'x-user-role';

const extractUserFromHeaders = (req: RequestWithUser): { userId: string; email: string; role: string } | null => {
  const userId = req.headers[USER_ID_HEADER] as string;
  const userEmail = req.headers[USER_EMAIL_HEADER] as string;
  const userRole = req.headers[USER_ROLE_HEADER] as string;

  if (!userId) {
    return null;
  }

  return { userId, email: userEmail, role: userRole };
};

const determineUserType = (role: string): string => {
  return role === 'company' ? 'company' : 'individual';
};

const createUnauthorizedResponse = () => ({
  error: 'User not authenticated. Request must go through API Gateway.',
});

export const authenticateToken = (req: RequestWithUser, res: Response, next: NextFunction): void => {
  const userInfo = extractUserFromHeaders(req);

  if (!userInfo) {
    res.status(HttpStatusCode.UNAUTHORIZED).json(createUnauthorizedResponse());
    return;
  }

  const { userId, email, role } = userInfo;

  req.user = {
    userId,
    email,
    role,
    userType: determineUserType(role),
  };

  logger.info('User context set from API Gateway headers', { userId, email, role });
  next();
};

