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

    this._redis.on('error', (error: any) => {
      console.error('Redis connection error:', error);
    });

    this._redis.on('connect', () => {
      console.log('✅ Connected to Redis (Company Service)');
    });
  }

  async storeOTP(email: string, otp: string, expiresIn: number = 300): Promise<void> {
    const key = `company_otp:${email}`;
    await this._redis.setex(key, expiresIn, otp);
    console.log(`[Redis] Stored company OTP for ${email}, expires in ${expiresIn}s`);
  }

  async getOTP(email: string): Promise<string | null> {
    const key = `company_otp:${email}`;
    const otp = await this._redis.get(key);
    console.log(`[Redis] Retrieved company OTP for ${email}: ${otp ? 'FOUND' : 'NOT FOUND'}`);
    return otp;
  }

  async deleteOTP(email: string): Promise<void> {
    const key = `company_otp:${email}`;
    await this._redis.del(key);
    console.log(`[Redis] Deleted company OTP for ${email}`);
  }

  async hasOTP(email: string): Promise<boolean> {
    const key = `company_otp:${email}`;
    const exists = await this._redis.exists(key);
    return exists === 1;
  }

  async getOTPTTL(email: string): Promise<number> {
    const key = `company_otp:${email}`;
    return await this._redis.ttl(key);
  }

  async getCompanyJobCount(companyId: string): Promise<number> {
    try {
      const count = await this._redis.get(`company:${companyId}:jobCount`);
      return count ? parseInt(count) : 0;
    } catch (error) {
      console.error('Error getting job count from Redis:', error);
      return 0;
    }
  }
  
  async setCompanyJobCount(companyId: string, count: number): Promise<void> {
    try {
      await this._redis.set(`company:${companyId}:jobCount`, count.toString());
    } catch (error) {
      console.error('Error setting job count in Redis:', error);
    }
  }
}
