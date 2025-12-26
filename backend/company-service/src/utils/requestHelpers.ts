import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { HttpStatusCode } from '../enums/StatusCodes';
import { Messages } from '../constants/Messages';
import { buildErrorResponse } from 'hireorbit-shared-dto';

/**
 * Extracts and validates companyId from request
 * Returns companyId if valid, otherwise sends error response and returns null
 */
export const getCompanyIdFromRequest = (req: Request, res: Response): string | null => {
  const companyId = (req as AuthenticatedRequest).user?.companyId || 
                    (req.headers['x-user-id'] as string);

  if (!companyId) {
    res.status(HttpStatusCode.UNAUTHORIZED).json(
      buildErrorResponse(Messages.AUTH.COMPANY_NOT_AUTHENTICATED, Messages.AUTH.AUTHENTICATION_REQUIRED),
    );
    return null;
  }

  return companyId;
};

/**
 * Extracts and validates admin userId and role from request
 * Returns userId if valid admin, otherwise sends error response and returns null
 */
export const getAdminIdFromRequest = (req: Request, res: Response): string | null => {
  const userId = req.headers['x-user-id'] as string;
  const role = req.headers['x-user-role'] as string;

  if (!userId || role !== 'admin') {
    res.status(HttpStatusCode.UNAUTHORIZED).json(
      buildErrorResponse(Messages.AUTH.ADMIN_NOT_AUTHENTICATED, Messages.AUTH.ADMIN_AUTH_REQUIRED),
    );
    return null;
  }

  return userId;
};
