import { injectable } from 'inversify';
import Redis from 'ioredis';

@injectable()
export class RedisService {
  private _redis: Redis;

  constructor() {
    this._redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      lazyConnect: true,
      keepAlive: 30000,
      maxRetriesPerRequest: 3,
    });

    this._redis.on('error', (error: Error) => {
      console.error('Redis connection error:', error);
    });

    this._redis.on('connect', () => {
      console.log(' Connected to Redis');
    });
  }

  async storeOTP(
    email: string,
    otp: string,
    expiresIn: number = 300
  ): Promise<void> {
    const key = `otp:${email}`;
    await this._redis.setex(key, expiresIn, otp);
    console.log(`[Redis] Stored OTP for ${email}, expires in ${expiresIn}s`);
  }

  async getOTP(email: string): Promise<string | null> {
    const key = `otp:${email}`;
    const otp = await this._redis.get(key);
    console.log(
      `[Redis] Retrieved OTP for ${email}: ${otp ? 'FOUND' : 'NOT FOUND'}`
    );
    return otp;
  }

  async deleteOTP(email: string): Promise<void> {
    const key = `otp:${email}`;
    await this._redis.del(key);
    console.log(`[Redis] Deleted OTP for ${email}`);
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
    expiresIn: number = 900
  ): Promise<void> {
    const key = `password_reset:${email}:${role}`;
    await this._redis.setex(key, expiresIn, otp);
    console.log(
      `[Redis] Stored password reset OTP for ${email}:${role}, expires in ${expiresIn}s`
    );
  }

  async getPasswordResetOTP(
    email: string,
    role: string
  ): Promise<string | null> {
    const key = `password_reset:${email}:${role}`;
    const otp = await this._redis.get(key);
    console.log(
      `[Redis] Retrieved password reset OTP for ${email}:${role}: ${
        otp ? 'FOUND' : 'NOT FOUND'
      }`
    );
    return otp;
  }

  async deletePasswordResetOTP(email: string, role: string): Promise<void> {
    const key = `password_reset:${email}:${role}`;
    await this._redis.del(key);
    console.log(`[Redis] Deleted password reset OTP for ${email}:${role}`);
  }

  async incrementLoginAttempts(
    email: string,
    expiresIn: number = 900
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
    sessionData: any,
    expiresIn: number = 86400
  ): Promise<void> {
    const key = `session:${userId}`;
    await this._redis.setex(key, expiresIn, JSON.stringify(sessionData));
  }

  async getUserSession(userId: string): Promise<any | null> {
    const key = `session:${userId}`;
    const session = await this._redis.get(key);
    return session ? JSON.parse(session) : null;
  }

  async deleteUserSession(userId: string): Promise<void> {
    const key = `session:${userId}`;
    await this._redis.del(key);
  }

  async storeRefreshToken(userId: string, tokenId: string, refreshToken: string, expiresIn: number = 604800): Promise<void> {
  const key = `refresh_token:${userId}:${tokenId}`;
  console.log(' RedisService - Storing refresh token:', { userId, tokenId, key });
  
  try {
    await this._redis.setex(key, expiresIn, refreshToken);
    console.log(' RedisService - Token stored successfully');
  } catch (error) {
    console.error(' RedisService - Failed to store token:', error);
    throw error;
  }
}

  async getRefreshToken(userId: string, tokenId: string): Promise<string | null> {
  const key = `refresh_token:${userId}:${tokenId}`;
  console.log(' RedisService - Getting refresh token:', { userId, tokenId, key });
  
  try {
    const token = await this._redis.get(key);
    console.log(' RedisService - Get result:', {
      key,
      found: !!token
    });
    return token;
  } catch (error) {
    console.error(' RedisService - Redis error:', error);
    throw error;
  }
}

  async deleteRefreshToken(userId: string, tokenId: string): Promise<void> {
    const key = `refresh_token:${userId}:${tokenId}`;
    await this._redis.del(key);
    console.log(`[Redis] Deleted refresh token for ${userId}`);
  }

  async deleteAllUserRefreshTokens(userId: string): Promise<void> {
    const pattern = `refresh_token:${userId}:*`;
    const keys = await this._redis.keys(pattern);
    if (keys.length > 0) {
      await this._redis.del(...keys);
      console.log(`[Redis] Deleted all refresh tokens for ${userId}`);
    }
  }
}
