import { Request } from 'express';

/**
 * Extended Request interface with user information
 */
export interface RequestWithUser extends Omit<Request, 'user'> {
  user?: {
    userId: string;
    email: string;
    role: string;
    userType: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
    companyName?: string;
  };
}