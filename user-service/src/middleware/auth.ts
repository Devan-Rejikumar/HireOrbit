import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma/client';
import { HttpStatusCode } from '../enums/StatusCodes';

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
    const authHeader = req.headers.authorization;
    const token = req.cookies['accessToken']


    if (!token) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({ 
        success: false, 
        error: 'Access token required',
        message: 'Please provide a valid access token'
      });
      return;
    }
    const jwtSecret = process.env.JWT_SECRET || 'supersecret'; 
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    if (decoded.role === 'jobseeker') {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { isBlocked: true }
      });

      if (user?.isBlocked) {
        console.log(' User is blocked:', decoded.userId);
        res.status(HttpStatusCode.FORBIDDEN).json({
          success: false,
          error: 'Account blocked',
          message: 'Account blocked'
        });
        return;
      }
    }

    req.headers['x-user-id'] = decoded.userId;
    req.headers['x-user-email'] = decoded.email;
    req.headers['x-user-role'] = decoded.role;
    (req as any).user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      userType: decoded.userType
    };

    console.log('Authentication successful:', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    });

    next();
  } catch (error) {
    console.log('Token verification failed:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({
        success: false,
        error: 'Token expired',
        message: 'Your session has expired. Please login again.'
      });
      return;
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(HttpStatusCode.UNAUTHORIZED).json({
        success: false,
        error: 'Invalid token',
        message: 'Invalid access token. Please login again.'
      });
      return;
    }

    res.status(HttpStatusCode.UNAUTHORIZED).json({
      success: false,
      error: 'Authentication failed',
      message: 'Unable to verify your identity. Please login again.'
    });
  }
};
