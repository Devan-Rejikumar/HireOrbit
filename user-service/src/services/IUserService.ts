import { User } from '@prisma/client';
import { TokenPair } from '../types/auth';
export interface IUserService {
  register(email: string, password: string, name: string, role?: string): Promise<User>;
  login(email: string, password: string): Promise<{ user: User; tokens: TokenPair }>; // Return user and token instead
  generateOTP(email: string): Promise<{ message: string }>;
  verifyOTP(email: string, otp: number): Promise<{ message: string }>;
  resendOTP(email: string): Promise<{ message: string }>;
  getAllUsers(): Promise<User[]>;
  getAllUsersWithPagination(page?: number, limit?: number): Promise<{ data: User[]; total: number; page: number; totalPages: number }>;
  blockUser(id: string): Promise<User>;
  unblockUser(id: string): Promise<User>;
  verifyPasswordResetOTP(email: string, otp: string): Promise<{ message: string }>;
  forgotPassword(email: string): Promise<{ message: string }>;
  resetPassword(email: string, newPassword: string): Promise<{ message: string }>;
  updateUserName(userId: string, name: string): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  createGoogleUser(userData: {email: string;fullName: string; profilePicture?: string;}): Promise<User>;
  findById(id: string): Promise<User | null>;
  refreshToken(refreshToken: string): Promise<{accessToken: string}>;
  logout(userId: string, tokenId: string): Promise<void>;
  logoutAllSessions(userId: string): Promise<void>;
  logoutWithToken(refreshToken: string): Promise<void>;
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }>;
}
