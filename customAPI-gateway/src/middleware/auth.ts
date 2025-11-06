import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { JWT_SECRET } from '@/config';
import { getServiceUrl } from '@/config/services';
interface JwtPayload {userId: string;email: string;role: string;}

interface AuthRequest extends Request {
  user?: JwtPayload;
}


export const Authenticate = async (req: AuthRequest,res: Response,next: NextFunction): Promise<void> => {
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
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    
    // Check if user is blocked (only for jobseeker role)
    if (payload.role === 'jobseeker') {
      try {
        // Call user-service directly (bypassing gateway to avoid recursion)
        // Use internal service URL directly - should be like http://localhost:3000
        const directUserServiceUrl = process.env.USER_SERVICE_URL || getServiceUrl('user');
        // Call getUserById which doesn't require auth but returns user data including isBlocked
        const response = await axios.get(`${directUserServiceUrl}/api/users/${payload.userId}`, {
          timeout: 1000, // 1 second timeout for quick check
          validateStatus: () => true // Accept all status codes to check response
        });
        
        // Check if user is blocked
        const user = response.data?.data?.user || response.data?.user;
        if (user?.isBlocked) {
          res.status(403).json({ 
            error: 'Account blocked',
            message: 'Account blocked'
          });
          return;
        }
      } catch (checkError: any) {
        // If check fails for other reasons, log but don't block (to avoid blocking legitimate users if user-service is down)
        console.error('Error checking user blocked status:', checkError.message);
        // Continue with request - don't block if we can't verify
      }
    }
    
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