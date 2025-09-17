import { Request } from 'express';

export interface AuthToken {
  id?: string;
  userId?: string
  companyId?: string
  email: string;
  role: string;
  userType: string;
  companyName?: string;
  iat: number;
  exp: number;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    userType: string;
    companyName?: string;
  }
}

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: string;
  isVerified: boolean;
  isBlocked: boolean;
  isGoogleUser: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  email: string;
  companyName: string;
  password: string;
  isVerified: boolean;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserLoginRequest {
  email: string;
  password: string;
  role: string;
}

export interface CompanyLoginRequest {
  email: string;
  password: string;
}

export interface AdminLoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    userType: string;
  };
  admin?: {
    id: string;
    email: string;
    name: string;
    role: string;
    userType: string;
  };
  company?: {
    id: string;
    email: string;
    companyName: string;
    userType: string;
  };
}