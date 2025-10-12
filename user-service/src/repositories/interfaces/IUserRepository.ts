import { User } from '@prisma/client';
import { PaginationResult } from '../../interfaces/IBaseRepository';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  createUser(data: {
    email: string;
    password: string;
    name: string;
    isGoogleUser?: boolean;
  }): Promise<User>;
  findById(id: string): Promise<User | null>;
  getAllUsers(page?: number, limit?: number): Promise<PaginationResult<User>>;
  blockUser(id: string): Promise<User>;
  unblockUser(id: string): Promise<User>;
  updateUserPassword(email: string, hashedPassword: string): Promise<void>;
  updateUserName(userId: string, name: string): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
}