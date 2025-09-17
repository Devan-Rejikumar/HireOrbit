import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { buildErrorResponse } from 'shared-dto';
import { HttpStatusCode } from '../enums/StatusCodes';

interface CompanyTokenPayload extends JwtPayload {
  userId: string;  
  companyId: string;  
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
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(HttpStatusCode.UNAUTHORIZED).json(buildErrorResponse('No token provided', 'Authentication required'));
      return;
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(buildErrorResponse('Server configuration error', 'Internal server error'));
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as CompanyTokenPayload;
    
    if (decoded.role !== 'company') {
      res.status(HttpStatusCode.FORBIDDEN).json(buildErrorResponse('Invalid token type', 'Company token required'));
      return;
    }

    const companyId = decoded.userId || decoded.companyId; 

    if (!companyId) {
      res.status(HttpStatusCode.UNAUTHORIZED).json(buildErrorResponse('Company not authenticated', 'Authentication required'));
      return;
    }
    
    req.user = {
      companyId: companyId,
      email: decoded.email,
      role: decoded.role,
      userType: decoded.userType
    };

    next();
  } catch (error) {
    res.status(HttpStatusCode.UNAUTHORIZED).json(buildErrorResponse('Invalid token', 'Authentication failed'));
  }
};