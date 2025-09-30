import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/config';
interface JwtPayload {userId: string;email: string;role: string;}

interface AuthRequest extends Request {
  user?: JwtPayload;
}


export const Authenticate = (req: AuthRequest,res: Response,next: NextFunction): void => {
  let token: string | undefined;
  
  // Try to get token from Authorization header first
  const authHeader = req.headers.authorization;
  if (authHeader) {
    token = authHeader.split(' ')[1];
  }
  
  // If no token in header, try to get from cookies
  if (!token && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    token = cookies.accessToken;
  }
  
  if (!token) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = payload;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid token' });
    return;
  }
};

export const AuthorizeRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    if (!req.user.role || !roles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }
    next();
  };
};

export const RequireUser = AuthorizeRole(['user']);
export const RequireCompany = AuthorizeRole(['company']);
export const RequireAdmin = AuthorizeRole(['admin']);
export const RequireUserOrCompany = AuthorizeRole(['user', 'company']);
export const RequireCompanyOrAdmin = AuthorizeRole(['company', 'admin']);