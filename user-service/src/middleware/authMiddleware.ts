import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AccessTokenPayload } from '../types/auth';

// Extend Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  console.log('🔍 [AUTH-MIDDLEWARE] Starting authentication');
  console.log('🔍 [AUTH-MIDDLEWARE] Request URL:', req.url);
  console.log('🔍 [AUTH-MIDDLEWARE] Request method:', req.method);
  console.log('🔍 [AUTH-MIDDLEWARE] Authorization header:', req.headers.authorization);
  console.log('🔍 [AUTH-MIDDLEWARE] Cookies received:', req.cookies);
  console.log('🔍 [AUTH-MIDDLEWARE] All headers:', req.headers);
  
  // Try to get token from Authorization header first (preferred method)
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('🔍 [AUTH-MIDDLEWARE] Token found in Authorization header');
  } else if (req.cookies.accessToken) {
    // Fallback to cookies for backward compatibility
    token = req.cookies.accessToken;
    console.log('🔍 [AUTH-MIDDLEWARE] Token found in cookies (fallback)');
  }
  
  if (!token) {
    console.log('❌ [AUTH-MIDDLEWARE] No access token found in Authorization header or cookies');
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  try {
    console.log('🔍 [AUTH-MIDDLEWARE] Token found, verifying...');
    const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';
    const decoded = jwt.verify(token, JWT_SECRET) as AccessTokenPayload;
    
    console.log('✅ [AUTH-MIDDLEWARE] Token verified successfully:', decoded);
    
    // Set the required headers that the controller expects (for backward compatibility)
    req.headers['x-user-id'] = decoded.userId;
    req.headers['x-user-email'] = decoded.email;
    req.headers['x-user-role'] = decoded.role;
    
    // Set user data on request object (preferred method)
    req.user = decoded;
    
    console.log('✅ [AUTH-MIDDLEWARE] User context set:', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      userType: decoded.userType
    });
    
    next();
  } catch (error) {
    console.error('❌ [AUTH-MIDDLEWARE] Token verification failed:', error);
    res.status(401).json({ error: 'User not authenticated' });
  }
};
