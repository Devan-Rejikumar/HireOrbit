import { injectable } from 'inversify';
import Redis from 'ioredis';

@injectable()
export class RedisService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      lazyConnect: true,
      keepAlive: 30000,
      maxRetriesPerRequest: 3,   
    });

    this.redis.on('error', (error: any) => {
      console.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      console.log('✅ Connected to Redis (Company Service)');
    });
  }

  async storeOTP(email: string, otp: string, expiresIn: number = 300): Promise<void> {
    const key = `company_otp:${email}`;
    await this.redis.setex(key, expiresIn, otp);
    console.log(`[Redis] Stored company OTP for ${email}, expires in ${expiresIn}s`);
  }

  async getOTP(email: string): Promise<string | null> {
    const key = `company_otp:${email}`;
    const otp = await this.redis.get(key);
    console.log(`[Redis] Retrieved company OTP for ${email}: ${otp ? 'FOUND' : 'NOT FOUND'}`);
    return otp;
  }

  async deleteOTP(email: string): Promise<void> {
    const key = `company_otp:${email}`;
    await this.redis.del(key);
    console.log(`[Redis] Deleted company OTP for ${email}`);
  }

  async hasOTP(email: string): Promise<boolean> {
    const key = `company_otp:${email}`;
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  async getOTPTTL(email: string): Promise<number> {
    const key = `company_otp:${email}`;
    return await this.redis.ttl(key);
  }

  async getCompanyJobCount(companyId: string): Promise<number> {
    try {
      const count = await this.redis.get(`company:${companyId}:jobCount`);
      return count ? parseInt(count) : 0;
    } catch (error) {
      console.error('Error getting job count from Redis:', error);
      return 0;
    }
  }
  
  async setCompanyJobCount(companyId: string, count: number): Promise<void> {
    try {
      await this.redis.set(`company:${companyId}:jobCount`, count.toString());
    } catch (error) {
      console.error('Error setting job count in Redis:', error);
    }
  }
}
