import { Request } from 'express';

export interface AuthRequest extends Request {
  headers: {
    'x-user-id'?: string;
    'x-user-email'?: string;
    'x-user-role'?: string;
    [key: string]: string | string[] | undefined;
  };
}

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

declare global {
  namespace Express {
    interface Request {
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
  }
}

export {};

