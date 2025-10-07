import { User, Otp } from '@prisma/client';
import { PaginationResult } from '../interfaces/IBaseRepository';

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  profilePicture?: string;
  isGoogleUser?: boolean;
}


export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  createUser(data: {
    email: string;
    password: string;
    name: string;
    role: string;
  }): Promise<User>;
  findById(id: string): Promise<User | null>;
  saveOTP(email: string, otp: number): Promise<Otp>;
  findOTP(email: string): Promise<Otp | null>;
  deleteOTP(email: string): Promise<void>;
   getAllUsers(page?: number, limit?: number): Promise<PaginationResult<User>>;
  blockUser(id: string): Promise<User>;
  unblockUser(id: string): Promise<User>;
  savePasswordResetOTP(
    email: string,
    role: string,
    otp: string,
    expiresAt: Date
  ): Promise<any>;
  findPasswordResetOTP(email: string, otp: string): Promise<any>;
  deletePasswordResetOTP(email: string, otp: string): Promise<void>;
  updateUserPassword(email: string, hashedPassword: string): Promise<void>;
  updateUserName(userId: string, name: string): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
}
