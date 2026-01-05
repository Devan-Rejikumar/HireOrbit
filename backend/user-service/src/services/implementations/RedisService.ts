import { injectable } from 'inversify';
import Redis from 'ioredis';
import { UserSessionData } from '../../types/session';
import {
  OTP_EXPIRY_SECONDS,
  PASSWORD_RESET_OTP_EXPIRY_SECONDS,
  REFRESH_TOKEN_EXPIRY_SECONDS,
  SESSION_EXPIRY_SECONDS
} from '../../constants/TimeConstants';
import { AppConfig } from '../../config/app.config';
import { logger } from '../../utils/logger';

@injectable()
export class RedisService {
  private _redis: Redis;

  constructor() {
    this._redis = new Redis({
      host: AppConfig.REDIS_HOST,
      port: AppConfig.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
      lazyConnect: true,
      keepAlive: AppConfig.REDIS_KEEP_ALIVE_MS,
      maxRetriesPerRequest: 3,
    });

    this._redis.on('error', (error: Error) => {
      logger.error('Redis connection error:', error);
    });

    this._redis.on('connect', () => {
      logger.info('Connected to Redis');
    });
  }

  async storeOTP(
    email: string,
    otp: string,
    expiresIn: number = OTP_EXPIRY_SECONDS
  ): Promise<void> {
    const key = `otp:${email}`;
    await this._redis.setex(key, expiresIn, otp);
    logger.debug(`[Redis] Stored OTP for ${email}, expires in ${expiresIn}s`);
  }

  async getOTP(email: string): Promise<string | null> {
    const key = `otp:${email}`;
    const otp = await this._redis.get(key);
    logger.debug(
      `[Redis] Retrieved OTP for ${email}: ${otp ? 'FOUND' : 'NOT FOUND'}`
    );
    return otp;
  }

  async deleteOTP(email: string): Promise<void> {
    const key = `otp:${email}`;
    await this._redis.del(key);
    logger.debug(`[Redis] Deleted OTP for ${email}`);
  }

  async hasOTP(email: string): Promise<boolean> {
    const key = `otp:${email}`;
    const exists = await this._redis.exists(key);
    return exists === 1;
  }

  async getOTPTTL(email: string): Promise<number> {
    const key = `otp:${email}`;
    return await this._redis.ttl(key);
  }

  async storePasswordResetOTP(
    email: string,
    role: string,
    otp: string,
    expiresIn: number = PASSWORD_RESET_OTP_EXPIRY_SECONDS
  ): Promise<void> {
    const key = `password_reset:${email}:${role}`;
    await this._redis.setex(key, expiresIn, otp);
    logger.debug(
      `[Redis] Stored password reset OTP for ${email}:${role}, expires in ${expiresIn}s`
    );
  }

  async getPasswordResetOTP(
    email: string,
    role: string
  ): Promise<string | null> {
    const key = `password_reset:${email}:${role}`;
    const otp = await this._redis.get(key);
    logger.debug(
      `[Redis] Retrieved password reset OTP for ${email}:${role}: ${
        otp ? 'FOUND' : 'NOT FOUND'
      }`
    );
    return otp;
  }

  async deletePasswordResetOTP(email: string, role: string): Promise<void> {
    const key = `password_reset:${email}:${role}`;
    await this._redis.del(key);
    logger.debug(`[Redis] Deleted password reset OTP for ${email}:${role}`);
  }

  async incrementLoginAttempts(
    email: string,
    expiresIn: number = PASSWORD_RESET_OTP_EXPIRY_SECONDS
  ): Promise<number> {
    const key = `login_attempts:${email}`;
    const attempts = await this._redis.incr(key);

    if (attempts === 1) {
      await this._redis.expire(key, expiresIn);
    }

    return attempts;
  }

  async getLoginAttempts(email: string): Promise<number> {
    const key = `login_attempts:${email}`;
    const attempts = await this._redis.get(key);
    return attempts ? parseInt(attempts) : 0;
  }

  async resetLoginAttempts(email: string): Promise<void> {
    const key = `login_attempts:${email}`;
    await this._redis.del(key);
  }

  async storeUserSession(
    userId: string,
    sessionData: UserSessionData,
    expiresIn: number = SESSION_EXPIRY_SECONDS
  ): Promise<void> {
    const key = `session:${userId}`;
    await this._redis.setex(key, expiresIn, JSON.stringify(sessionData));
  }

  async getUserSession(userId: string): Promise<UserSessionData | null> {
    const key = `session:${userId}`;
    const session = await this._redis.get(key);
    return session ? JSON.parse(session) as UserSessionData : null;
  }

  async deleteUserSession(userId: string): Promise<void> {
    const key = `session:${userId}`;
    await this._redis.del(key);
  }

  async storeRefreshToken(userId: string, tokenId: string, refreshToken: string, expiresIn: number = REFRESH_TOKEN_EXPIRY_SECONDS): Promise<void> {
    const key = `refresh_token:${userId}:${tokenId}`;
    logger.debug('RedisService - Storing refresh token:', { userId, tokenId, key });
    
    try {
      await this._redis.setex(key, expiresIn, refreshToken);
      logger.debug('RedisService - Token stored successfully');
    } catch (error) {
      logger.error('RedisService - Failed to store token:', error);
      throw error;
    }
  }

  async getRefreshToken(userId: string, tokenId: string): Promise<string | null> {
    const key = `refresh_token:${userId}:${tokenId}`;
    logger.debug('RedisService - Getting refresh token:', { userId, tokenId, key });
    
    try {
      const token = await this._redis.get(key);
      logger.debug('RedisService - Get result:', {
        key,
        found: !!token
      });
      return token;
    } catch (error) {
      logger.error('RedisService - Redis error:', error);
      throw error;
    }
  }

  async deleteRefreshToken(userId: string, tokenId: string): Promise<void> {
    const key = `refresh_token:${userId}:${tokenId}`;
    await this._redis.del(key);
    logger.debug(`[Redis] Deleted refresh token for ${userId}`);
  }

  async deleteAllUserRefreshTokens(userId: string): Promise<void> {
    const pattern = `refresh_token:${userId}:*`;
    const keys = await this._redis.keys(pattern);
    if (keys.length > 0) {
      await this._redis.del(...keys);
      logger.debug(`[Redis] Deleted all refresh tokens for ${userId}`);
    }
  }
}