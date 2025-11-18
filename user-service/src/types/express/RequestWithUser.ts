import { Request } from 'express';
/**
 * Extended Request interface with user information
 * Used in controllers that require authenticated user context
 */
export interface RequestWithUser extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    userType?: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
    companyName?: string;
  };
}