/**
 * Application Configuration
 * Non-sensitive configuration values with safe defaults
 * Sensitive values (secrets, passwords) should be in .env file
 */

export const AppConfig = {
  PORT: process.env.PORT || '3001',
  
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379'),
  REDIS_KEEP_ALIVE_MS: parseInt(process.env.REDIS_KEEP_ALIVE_MS || '30000'),
  
  JSON_BODY_SIZE_LIMIT_MB: parseInt(process.env.JSON_BODY_SIZE_LIMIT_MB || '20'),
  URL_ENCODED_BODY_SIZE_LIMIT_MB: parseInt(process.env.URL_ENCODED_BODY_SIZE_LIMIT_MB || '10'),
  
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  JOB_SERVICE_URL: process.env.JOB_SERVICE_URL || 'http://localhost:3002',
  
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587'),
  SMTP_FROM: process.env.SMTP_FROM || '"Job Portal" <no-reply@jobportal.com>',
  
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || 'localhost',
  LOKI_HOST: process.env.LOKI_HOST || 'http://localhost:3100',
  
  JWT_SECRET: process.env.JWT_SECRET!,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET!,
  
  OTP_MIN_VALUE: parseInt(process.env.OTP_MIN_VALUE || '100000'),
  OTP_MAX_VALUE: parseInt(process.env.OTP_MAX_VALUE || '900000'),
} as const;

