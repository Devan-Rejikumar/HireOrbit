// import { User } from '@prisma/client';
// import { TokenPair } from '../../types/auth';
import { AuthResponse, UserResponse } from '../../dto/responses/user.response';
export interface IUserService {
  register(email: string, password: string, name: string, role?: string): Promise<UserResponse>;
  login(email: string, password: string): Promise<AuthResponse>; 
  generateOTP(email: string): Promise<{ message: string }>;
  generateVerificationOTP(email: string): Promise<{ message: string }>;
  verifyOTP(email: string, otp: number): Promise<{ message: string }>;
  resendOTP(email: string): Promise<{ message: string }>;
  getAllUsers(): Promise<UserResponse[]>;
  getAllUsersWithPagination(page?: number, limit?: number): Promise<{ data: UserResponse[]; total: number; page: number; totalPages: number }>;
  blockUser(id: string): Promise<UserResponse>;
  unblockUser(id: string): Promise<UserResponse>;
  verifyPasswordResetOTP(email: string, otp: string): Promise<{ message: string }>;
  forgotPassword(email: string): Promise<{ message: string }>;
  resetPassword(email: string, newPassword: string): Promise<{ message: string }>;
  updateUserName(userId: string, name: string): Promise<UserResponse>;
  findByEmail(email: string): Promise<UserResponse | null>;
  createGoogleUser(userData: {email: string;fullName: string; profilePicture?: string;}): Promise<UserResponse>;
  findById(id: string): Promise<UserResponse | null>;
  refreshToken(refreshToken: string): Promise<{accessToken: string}>;
  logout(userId: string, tokenId: string): Promise<void>;
  logoutAllSessions(userId: string): Promise<void>;
  logoutWithToken(refreshToken: string): Promise<void>;
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ message: string }>;
}
