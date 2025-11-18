import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { JWT_SECRET } from '@/config';
import { getServiceUrl } from '@/config/services';
import { Role } from '@/enums/Role';
import { HttpStatusCode } from '@/enums/HttpStatusCode';
import { CommonMessages } from '@/constants/CommonMessages';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const Authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    token = authHeader.split(' ')[1];
  }
  
  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    token = cookies.accessToken;
  }
  
  if (!token) {
    res.status(HttpStatusCode.UNAUTHORIZED).json({ message: CommonMessages.NO_TOKEN_PROVIDED });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (payload.role === Role.JOBSEEKER) {
      try {
        const directUserServiceUrl = process.env.USER_SERVICE_URL || getServiceUrl('user');
        const response = await axios.get(`${directUserServiceUrl}/api/users/${payload.userId}`, {
          timeout: 1000, 
          validateStatus: () => true 
        });
        const user = response.data?.data?.user || response.data?.user;
        if (user?.isBlocked) {
          res.status(HttpStatusCode.FORBIDDEN).json({ 
            error: CommonMessages.ACCOUNT_BLOCKED,
            message: CommonMessages.ACCOUNT_BLOCKED
          });
          return;
        }
      } catch (checkError: any) {
        console.error('Error checking user blocked status:', checkError.message);
      }
    }
    
    req.user = payload;
    next();
  } catch (error) {
    res.status(HttpStatusCode.FORBIDDEN).json({ message: CommonMessages.INVALID_TOKEN });
    return;
  }
};

export const AuthorizeRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({ message: CommonMessages.UNAUTHORIZED });
      return;
    }
    if (!req.user.role || !roles.includes(req.user.role)) {
      res.status(HttpStatusCode.FORBIDDEN).json({ message: CommonMessages.FORBIDDEN });
      return;
    }
    next();
  };
};

export const RequireUser = AuthorizeRole([Role.JOBSEEKER]);
export const RequireCompany = AuthorizeRole([Role.COMPANY]);
export const RequireAdmin = AuthorizeRole([Role.ADMIN]);
export const RequireUserOrCompany = AuthorizeRole([Role.JOBSEEKER, Role.COMPANY]);
export const RequireCompanyOrAdmin = AuthorizeRole([Role.COMPANY, Role.ADMIN]);