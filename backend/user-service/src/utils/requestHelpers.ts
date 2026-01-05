import { Request, Response } from 'express';
import { RequestWithUser } from '../types/express/RequestWithUser';
import { HttpStatusCode } from '../enums/StatusCodes';
import { Messages } from '../constants/Messages';
import { buildErrorResponse } from 'hireorbit-shared-dto';
import { UserRole } from '../enums/UserRole';

/**
 * Extracts and validates userId from request
 * Returns userId if valid, otherwise sends error response and returns null
 * 
 */
export const getUserIdFromRequest = (req: Request, res: Response): string | null => {
  const userId = (req as RequestWithUser).user?.userId;

  if (!userId) {
    res.status(HttpStatusCode.UNAUTHORIZED).json(
      buildErrorResponse(Messages.AUTH.USER_NOT_AUTHENTICATED, Messages.ERROR.UNAUTHORIZED)
    );
    return null;
  }

  return userId;
};

/**
 * Extracts and validates admin userId and role from request
 * Returns userId if valid admin, otherwise sends error response and returns null
 */
export const getAdminIdFromRequest = (req: Request, res: Response): string | null => {
  const userId = (req as RequestWithUser).user?.userId;
  const role = (req as RequestWithUser).user?.role;

  if (!userId || role !== UserRole.ADMIN) {
    res.status(HttpStatusCode.UNAUTHORIZED).json(
      buildErrorResponse(Messages.AUTH.ADMIN_AUTH_REQUIRED, Messages.ERROR.UNAUTHORIZED)
    );
    return null;
  }

  return userId;
};