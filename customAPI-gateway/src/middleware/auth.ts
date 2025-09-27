import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '@/config';
interface JwtPayload {userId: string;email: string;role: string;}

interface AuthRequest extends Request {
  user?: JwtPayload;
}


export const Authenticate = (req: AuthRequest,res: Response,next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const token = authHeader.split(' ')[1];
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