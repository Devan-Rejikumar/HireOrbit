import { Request } from 'express';

/**
 * Extended Express Request interface for authenticated requests
 * Includes user information from API Gateway headers
 */
export interface AuthRequest extends Request {
  headers: {
    'x-user-id'?: string;
    'x-user-email'?: string;
    'x-user-role'?: string;
    [key: string]: any;
  };
}

/**
 * Extended Express Request with user context
 */
export interface RequestWithUser extends Omit<Request, 'user'> {
  user?: {
    userId: string;
    email: string;
    role: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
  };
}

