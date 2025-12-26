import { Request } from 'express';
export interface RequestWithUser extends Omit<Request, 'user'> {
  user?: {
    userId: string;
    email: string;
    role: string;
    userType: string;
  };
}