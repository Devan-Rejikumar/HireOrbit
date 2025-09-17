import { injectable, inject } from 'inversify';
import { Response } from 'express';
import TYPES from '../config/types';
import { IUserRepository } from '../repositories/IUserRepository';
import { EmailService } from './EmailService';
import { RedisService } from './RedisService';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { IUserService } from './IUserService';
import { prisma } from '../prisma/client';
import { JWTService } from './JWTService';
import { TokenPair } from '../types/auth';
import { ProfileData, UserProfile } from '../types/profile';



const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

@injectable()
export class UserService implements IUserService {
  constructor(
    @inject(TYPES.IUserRepository) private userRepository: IUserRepository,
    @inject(TYPES.EmailService) private emailService: EmailService,
    @inject(TYPES.RedisService) private redisService : RedisService,
    @inject(TYPES.JWTService) private jwtService: JWTService
  ) {}

  async register(
    email: string,
    password: string,
    name: string,
    role: string = 'jobseeker'
  ): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) throw new Error('Email already in use');
    const hashed = await bcrypt.hash(password, 10);
    return this.userRepository.createUser({
      email,
      password: hashed,
      name,
      role,
    });
  }

  async login(
    email: string,
    password: string,
    
  ): Promise<{user: User; tokens: TokenPair}> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new Error('Invalid credentials');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error('Invalid credentials');
    if (user.isBlocked) throw new Error('Account is blocked');
    console.log(
      'Signing token with secret:',
      JWT_SECRET.substring(0, 10) + '...'
    );
    const tokens = this.jwtService.generateTokenPair({
      userId:user.id,
      email:user.email,
      role:user.role,
      userType:'individual'
    });

    const refresTokenPayload = this.jwtService.verifyRefreshToken(tokens.refreshToken);
    await this.redisService.storeRefreshToken(
      user.id,
      refresTokenPayload.tokenId,
      tokens.refreshToken
    );

    return {user,tokens};
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    console.log('🔄 UserService - Starting refresh token process');
    try {
      console.log('🔍 UserService - Verifying refresh token');
      const refreshTokenPayload = this.jwtService.verifyRefreshToken(refreshToken);
      console.log('✅ UserService - Refresh token verified:', refreshTokenPayload);
      console.log('🔍 UserService - Checking Redis for stored token');
      const storedToken = await this.redisService.getRefreshToken(
        refreshTokenPayload.userId,
        refreshTokenPayload.tokenId
      );
      console.log('📦 UserService - Redis check result:', {
      hasStoredToken: !!storedToken,
      tokensMatch: storedToken === refreshToken
    });

      if (!storedToken || storedToken !== refreshToken) {
         console.error('❌ UserService - Token validation failed');
        throw new Error('Invalid refresh token');
      }
      console.log('🔄 UserService - Generating new access token');
      const newAccessToken = this.jwtService.generateNewAccessToken(refreshTokenPayload);
      console.log('✅ UserService - New access token generated');
      return { accessToken: newAccessToken };
    } catch (error) {
      console.error('❌ UserService - Refresh token error:', error);
      throw new Error('Invalid refresh token');
    }
  }

  async logout(userId: string, tokenId: string): Promise<void>{
    await this.redisService.deleteRefreshToken(userId, tokenId);
  }

  async logoutAllSessions(userId: string): Promise<void>{
    await this.redisService.deleteAllUserRefreshTokens(userId);
  }


  
  async generateOTP(email: string): Promise<{ message: string }> {
    console.log(` [UserService] generateOTP called with email: ${email}`);
    
    try {
      console.log(' [UserService] Checking if user exists');
      const existingUser = await this.userRepository.findByEmail(email);
      console.log(' [UserService] Existing user check result:', existingUser ? 'User exists' : 'User not found');
      
      if (existingUser) {
        console.log('[UserService] Email already registered, throwing error');
        throw new Error('Email already registered');
      }
      
      console.log(' [UserService] Generating OTP');
      const otp = Math.floor(100000 + Math.random() * 900000);
      console.log(` [UserService] Generated OTP: ${otp}`);
      
      await this.redisService.storeOTP(email, otp.toString(), 300);
      console.log(' [UserService] OTP saved to Redis');
      
      console.log(' [UserService] Calling emailService.sendOTP');
      await this.emailService.sendOTP(email, otp);
      console.log(' [UserService] Email service completed');
      
      console.log(' [UserService] Returning success message');
      return { message: 'OTP sent successfully' };
    } catch (error) {
      console.log(' [UserService] Error in generateOTP:', error);
      throw error;
    }
  }

  async verifyOTP(email: string, otp: number): Promise<{ message: string }> {
    const storedOtp = await this.redisService.getOTP(email);
    if (!storedOtp) {
      throw new Error('No OTP found for this email or OTP has expired');
    }
    if(parseInt(storedOtp)!==otp){
      throw new Error('Invalid OTP');
    }
    await this.redisService.deleteOTP(email);
    return {message: 'OTP verified successfully'};
  }

  async resendOTP(email: string): Promise<{ message: string; }> {
    const existingUser = await this.userRepository.findByEmail(email);
    if(existingUser) throw new Error('Email already registered');
    await this.redisService.deleteOTP(email);
    return this.generateOTP(email);
  }

  async getAllUsers(): Promise<User[]> {
    const result = await this.userRepository.getAllUsers();
    return result.data;
  }

  async getAllUsersWithPagination(page: number = 1, limit: number = 10): Promise<{ data: User[]; total: number; page: number; totalPages: number }> {
    return this.userRepository.getAllUsers(page, limit);
  }

  async blockUser(id: string): Promise<User> {
    const blockedUser = await this.userRepository.blockUser(id);
    return blockedUser;
  }

  async unblockUser(id: string): Promise<User> {
    const unblockUser = await this.userRepository.unblockUser(id);
    return unblockUser;
  }

  async forgotPassword(email: string): Promise<{ message: string; }> {
    const existingUser = await this.userRepository.findByEmail(email);
    if(!existingUser) throw new Error('User not found');
    const otp = Math.floor(100000+Math.random()*900000);
    const role = existingUser.role;
    await this.redisService.storePasswordResetOTP(email,role,otp.toString(),900);
    await this.emailService.sendPasswordResetOTP(email,otp);
    return { message: 'Password reset OTP sent successfully' };
  }

  async verifyPasswordResetOTP(
    email: string,
    otp: string
  ): Promise<{message: string}>{
    const user = await this.userRepository.findByEmail(email);
    if(!user) throw new Error('User not found');
    const storedOtp = await this.redisService.getPasswordResetOTP(email,user.role);
    if(!storedOtp) throw new Error('Invalid or expired OTP');
    if(storedOtp!==otp) throw new Error('Invalid OTP');
    await this.redisService.deletePasswordResetOTP(email, user.role);
    return {message: 'OTP verified successfully'};
  }

  async resetPassword(
    email: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new Error('User not found');
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userRepository.updateUserPassword(email, hashed);
    return { message: 'Password reset successful' };
  }

  async updateUserName(userId: string, name: string): Promise<User> {
    return this.userRepository.updateUserName(userId, name);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async createGoogleUser(userData: {
    email: string;
    fullName: string;
    profilePicture?: string;
  }): Promise<User> {
    return this.userRepository.createUser({
      email: userData.email,
      password: '',
      name: userData.fullName,
      role:'jobseeker'
    });
  }
  async findById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }
  async logoutWithToken(refreshToken: string): Promise<void> {
    try {
      const refreshTokenPayload = this.jwtService.verifyRefreshToken(refreshToken);
      await this.logout(refreshTokenPayload.userId, refreshTokenPayload.tokenId);
    } catch (error) {

      console.log('Invalid refresh token during logout');
    }
  }

}
