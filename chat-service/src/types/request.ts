import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId?: string;
    companyId?: string;
    role?: string;
  };
}