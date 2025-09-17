import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
        userType: string;
      };
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  console.log('🔍 [JOB-AUTH-MIDDLEWARE] Starting authentication');
  console.log('🔍 [JOB-AUTH-MIDDLEWARE] Authorization header:', req.headers.authorization);
  console.log('🔍 [JOB-AUTH-MIDDLEWARE] Cookies received:', req.cookies);
  
  // Try to get token from Authorization header first (preferred method)
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('🔍 [JOB-AUTH-MIDDLEWARE] Token found in Authorization header');
  } else if (req.cookies.accessToken) {
    // Fallback to cookies for backward compatibility
    token = req.cookies.accessToken;
    console.log('🔍 [JOB-AUTH-MIDDLEWARE] Token found in cookies (fallback)');
  }
  
  if (!token) {
    console.log('❌ [JOB-AUTH-MIDDLEWARE] No access token found in Authorization header or cookies');
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  try {
    console.log('🔍 [JOB-AUTH-MIDDLEWARE] Token found, verifying...');
    const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    console.log('✅ [JOB-AUTH-MIDDLEWARE] Token verified successfully:', decoded);
    
    // Set user data on request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      userType: decoded.userType || 'individual'
    };
    
    console.log('✅ [JOB-AUTH-MIDDLEWARE] User context set:', req.user);
    
    next();
  } catch (error) {
    console.error('❌ [JOB-AUTH-MIDDLEWARE] Token verification failed:', error);
    res.status(401).json({ error: 'User not authenticated' });
  }
};
