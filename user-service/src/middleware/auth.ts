import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma/client';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  userType: string;
  iat?: number;
  exp?: number;
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    console.log('🔒 Authentication middleware hit for:', req.method, req.url);
    console.log('🔒 Request headers:', req.headers);
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    console.log('🔒 Authorization header:', authHeader);
    
    // const token = authHeader && authHeader.split(' ')[1];  // Bearer TOKEN 
    const token = req.cookies['accessToken']
    console.log('🔒 Extracted token:', token ? 'Present' : 'Missing');

    if (!token) {
      console.log('🔒 No token provided');
      res.status(401).json({ 
        success: false, 
        error: 'Access token required',
        message: 'Please provide a valid access token'
      });
      return;
    }

    // Verify the token
    const jwtSecret = process.env.JWT_SECRET || 'supersecret';
    console.log('🔒 JWT Secret:', jwtSecret);
    console.log('🔒 Verifying token...');
    
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    console.log('🔒 Token decoded successfully:', decoded);
    console.log('🔒 Token expiration:', new Date(decoded.exp! * 1000));
    console.log('🔒 Current time:', new Date());
    console.log('🔒 Token expired?', new Date() > new Date(decoded.exp! * 1000));

    // Check if user is blocked (only for jobseeker role)
    if (decoded.role === 'jobseeker') {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { isBlocked: true }
      });

      if (user?.isBlocked) {
        console.log('🚫 User is blocked:', decoded.userId);
        res.status(403).json({
          success: false,
          error: 'Account blocked',
          message: 'Account blocked'
        });
        return;
      }
    }

    // Set user information in headers for controllers to use
    req.headers['x-user-id'] = decoded.userId;
    req.headers['x-user-email'] = decoded.email;
    req.headers['x-user-role'] = decoded.role;

    // Also set in req.user for compatibility
    (req as any).user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      userType: decoded.userType
    };

    console.log('🔒 Authentication successful:', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    });

    next();
  } catch (error) {
    console.log('🔒 Token verification failed:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expired',
        message: 'Your session has expired. Please login again.'
      });
      return;
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Invalid access token. Please login again.'
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: 'Unable to verify your identity. Please login again.'
    });
  }
};
