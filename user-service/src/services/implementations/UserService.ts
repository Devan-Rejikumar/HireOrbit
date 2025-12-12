import { injectable, inject } from 'inversify';
import TYPES from '../../config/types';
import { IUserRepository } from '../../repositories/interfaces/IUserRepository';
import { EmailService } from './EmailService';
import { RedisService } from './RedisService';
import bcrypt from 'bcryptjs';
// import { User } from '@prisma/client';
import { IUserService } from '../interfaces/IUserService';
import { JWTService } from './JWTService';
// import { TokenPair } from '../../types/auth';
import { mapUsersToResponse, mapUserToAuthResponse, mapUserToResponse } from '../../dto/mappers/user.mapper';
import { AuthResponse, UserResponse } from '../../dto/responses/user.response';
import { UserType } from '../../enums/UserType';
import { OTP_EXPIRY_SECONDS, PASSWORD_RESET_OTP_EXPIRY_SECONDS, OTP_MIN_VALUE, OTP_MAX_VALUE } from '../../constants/TimeConstants';
import { AppConfig } from '../../config/app.config';
import { logger } from '../../utils/logger';
import { AppError } from '../../utils/errors/AppError';
import { HttpStatusCode } from '../../enums/StatusCodes';

@injectable()
export class UserService implements IUserService {
  constructor(
    @inject(TYPES.IUserRepository) private _userRepository: IUserRepository,
    @inject(TYPES.EmailService) private _emailService: EmailService,
    @inject(TYPES.RedisService) private _redisService: RedisService,
    @inject(TYPES.JWTService) private _jwtService: JWTService
  ) { }

  async register(email: string, password: string, name: string): Promise<UserResponse> {
    const existingUser = await this._userRepository.findByEmail(email);
    if (existingUser) {
      if (existingUser.isVerified) {
        return mapUserToResponse(existingUser);
      }
      throw new AppError('Email already exist', HttpStatusCode.CONFLICT);
    }
    const hashed = await bcrypt.hash(password, AppConfig.BCRYPT_ROUNDS);
    const user = await this._userRepository.createUser({
      email,
      password: hashed,
      name
    });
    return mapUserToResponse(user);
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const user = await this._userRepository.findByEmail(email);
    if (!user) throw new AppError('Invalid credentials', HttpStatusCode.UNAUTHORIZED);
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new AppError('Invalid credentials', HttpStatusCode.UNAUTHORIZED);
    if (user.isBlocked) throw new AppError('Account blocked', HttpStatusCode.FORBIDDEN);
    const tokens = this._jwtService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
      userType: UserType.INDIVIDUAL
    });
    try {
      const refreshTokenPayload = this._jwtService.verifyRefreshToken(tokens.refreshToken);
      await this._redisService.storeRefreshToken(
        user.id,
        refreshTokenPayload.tokenId,
        tokens.refreshToken
      );
    } catch (redisError) {
      logger.warn('UserService Redis error (non-critical):', redisError);
    }
    logger.info('User Login successfully');
    return mapUserToAuthResponse(user, tokens);
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    logger.info('UserService - Starting refresh token process');
    try {
      logger.info('UserService - Verifying refresh token');
      const refreshTokenPayload = this._jwtService.verifyRefreshToken(refreshToken);
      logger.info('UserService - Refresh token verified:', refreshTokenPayload);
      
   
      const user = await this._userRepository.findById(refreshTokenPayload.userId);
      if (user?.isBlocked) {
        throw new AppError('Account blocked', HttpStatusCode.FORBIDDEN);
      }
      
      logger.info('UserService - Checking Redis for stored token');
      const storedToken = await this._redisService.getRefreshToken(
        refreshTokenPayload.userId,
        refreshTokenPayload.tokenId
      );
      logger.info('UserService - Redis check result:', {
        hasStoredToken: !!storedToken,
        tokensMatch: storedToken === refreshToken
      });
      if (!storedToken || storedToken !== refreshToken) {
        throw new AppError('Invalid refresh token', HttpStatusCode.UNAUTHORIZED);
      }
      logger.info('UserService - Generating new access token');
      const newAccessToken = this._jwtService.generateNewAccessToken(refreshTokenPayload);
      logger.info('UserService - New access token generated');
      return { accessToken: newAccessToken };
    } catch (error) {
      logger.error('UserService - Refresh token error:', error);
     
      if (error instanceof AppError && error.message === 'Account blocked') {
        throw error;
      }
      throw new AppError('Invalid refresh token', HttpStatusCode.UNAUTHORIZED);
    }
  }

  async logout(userId: string, tokenId: string): Promise<void> {
    await this._redisService.deleteRefreshToken(userId, tokenId);
  }

  async logoutAllSessions(userId: string): Promise<void> {
    await this._redisService.deleteAllUserRefreshTokens(userId);
  }



  async generateOTP(email: string): Promise<{ message: string }> {
    try {
      const existingUser = await this._userRepository.findByEmail(email);
      if (existingUser) {
        throw new AppError('Email already registered', HttpStatusCode.CONFLICT);
      }
      const otp = Math.floor(OTP_MIN_VALUE + Math.random() * (OTP_MAX_VALUE - OTP_MIN_VALUE));
      await this._redisService.storeOTP(email, otp.toString(), OTP_EXPIRY_SECONDS);
      await this._emailService.sendOTP(email, otp);
      return { message: 'OTP sent successfully' };
    } catch (error) {
      logger.error('[UserService] Error in generateOTP:', error);
      throw error;
    }
  }

  async generateVerificationOTP(email: string): Promise<{ message: string }> {
    try {
      const existingUser = await this._userRepository.findByEmail(email);
      if (!existingUser) {
        throw new AppError('User not found', HttpStatusCode.NOT_FOUND);
      }
      const otp = Math.floor(OTP_MIN_VALUE + Math.random() * (OTP_MAX_VALUE - OTP_MIN_VALUE));
      await this._redisService.storeOTP(email, otp.toString(), OTP_EXPIRY_SECONDS);
      await this._emailService.sendOTP(email, otp);
      return { message: 'OTP sent successfully' };
    } catch (error) {
      logger.error('[UserService] Error in generateVerificationOTP:', error);
      throw error;
    }
  }

  async verifyOTP(email: string, otp: number): Promise<{ message: string }> {
    const storedOtp = await this._redisService.getOTP(email);
    if (!storedOtp) {
      throw new AppError('No OTP found for this email or OTP has expired', HttpStatusCode.BAD_REQUEST);
    }
    if (parseInt(storedOtp) !== otp) {
      throw new AppError('Invalid OTP', HttpStatusCode.BAD_REQUEST);
    }

    const user = await this._userRepository.findByEmail(email);
    if (user) {
      await this._userRepository.updateUser(user.id, { isVerified: true });
    }

    await this._redisService.deleteOTP(email);
    return { message: 'OTP verified successfully' };
  }

  async resendOTP(email: string): Promise<{ message: string; }> {
    const existingUser = await this._userRepository.findByEmail(email);
    if (existingUser) throw new AppError('Email already registered', HttpStatusCode.CONFLICT);
    await this._redisService.deleteOTP(email);
    return this.generateOTP(email);
  }

  async getAllUsers(): Promise<UserResponse[]> {
    const result = await this._userRepository.getAllUsers();
    return mapUsersToResponse(result.data);
  }

  async getAllUsersWithPagination(page: number = 1, limit: number = 10): Promise<{ data: UserResponse[]; total: number; page: number; totalPages: number }> {
    const result = await this._userRepository.getAllUsers(page, limit);
    return {
      data: mapUsersToResponse(result.data),
      total: result.total,
      page: result.page,
      totalPages: result.totalPages
    };
  }

  async blockUser(id: string): Promise<UserResponse> {
    const blockedUser = await this._userRepository.blockUser(id);
    return mapUserToResponse(blockedUser);
  }

  async unblockUser(id: string): Promise<UserResponse> {
    const unblockUser = await this._userRepository.unblockUser(id);
    return mapUserToResponse(unblockUser);
  }

  async forgotPassword(email: string): Promise<{ message: string; }> {
    const existingUser = await this._userRepository.findByEmail(email);
    if (!existingUser) throw new AppError('User not found', HttpStatusCode.NOT_FOUND);
    const otp = Math.floor(OTP_MIN_VALUE + Math.random() * (OTP_MAX_VALUE - OTP_MIN_VALUE));
    const role = existingUser.role;
    await this._redisService.storePasswordResetOTP(email, role, otp.toString(), PASSWORD_RESET_OTP_EXPIRY_SECONDS);
    await this._emailService.sendPasswordResetOTP(email, otp);
    return { message: 'Password reset OTP sent successfully' };
  }

  async verifyPasswordResetOTP(
    email: string,
    otp: string
  ): Promise<{ message: string }> {
    const user = await this._userRepository.findByEmail(email);
    if (!user) throw new AppError('User not found', HttpStatusCode.NOT_FOUND);
    const storedOtp = await this._redisService.getPasswordResetOTP(email, user.role);
    if (!storedOtp) throw new AppError('Invalid or expired OTP', HttpStatusCode.BAD_REQUEST);
    if (storedOtp !== otp) throw new AppError('Invalid OTP', HttpStatusCode.BAD_REQUEST);
    await this._redisService.deletePasswordResetOTP(email, user.role);
    return { message: 'OTP verified successfully' };
  }

  async resetPassword(
    email: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const user = await this._userRepository.findByEmail(email);
    if (!user) throw new AppError('User not found', HttpStatusCode.NOT_FOUND);
    const hashed = await bcrypt.hash(newPassword, AppConfig.BCRYPT_ROUNDS);
    await this._userRepository.updateUserPassword(email, hashed);
    return { message: 'Password reset successful' };
  }

  async updateUserName(userId: string, name: string): Promise<UserResponse> {
    const updatedUser = await this._userRepository.updateUserName(userId, name);
    return mapUserToResponse(updatedUser);
  }


  async findByEmail(email: string): Promise<UserResponse | null> {
    const user = await this._userRepository.findByEmail(email);
    return user ? mapUserToResponse(user) : null;
  }

  async createGoogleUser(userData: {
    email: string;
    fullName: string;
    profilePicture?: string;
  }): Promise<UserResponse> {
    const user = await this._userRepository.createUser({
      email: userData.email,
      password: '', // Google users don't need a password
      name: userData.fullName,
      isGoogleUser: true, // Mark as Google user
    });
    return mapUserToResponse(user);
  }


  async findById(id: string): Promise<UserResponse | null> {
    const user = await this._userRepository.findById(id);
    return user ? mapUserToResponse(user) : null;
  }



  async logoutWithToken(refreshToken: string): Promise<void> {
    try {
      const refreshTokenPayload = this._jwtService.verifyRefreshToken(refreshToken);
      await this.logout(refreshTokenPayload.userId, refreshTokenPayload.tokenId);
    } catch {
      logger.warn('Invalid refresh token during logout');
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<{ message: string }> {
    const user = await this._userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', HttpStatusCode.NOT_FOUND);
    }
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', HttpStatusCode.UNAUTHORIZED);
    }
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new AppError('New password must be different from current password', HttpStatusCode.BAD_REQUEST);
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, AppConfig.BCRYPT_ROUNDS);
    await this._userRepository.updateUserPassword(user.email, hashedNewPassword);

    await this.logoutAllSessions(userId);

    return { message: 'Password changed successfully. Please login again.' };
  }

}
