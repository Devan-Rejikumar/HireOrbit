/**
 * Application Configuration
 * Non-sensitive configuration values with safe defaults
 * Sensitive values (secrets, passwords) should be in .env file
 */

export const AppConfig = {
  PORT: process.env.PORT || '3005',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL!,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY!,
  JSON_BODY_SIZE_LIMIT_MB: parseInt(process.env.JSON_BODY_SIZE_LIMIT_MB || '20'),
  URL_ENCODED_BODY_SIZE_LIMIT_MB: parseInt(process.env.URL_ENCODED_BODY_SIZE_LIMIT_MB || '10'),
  LOKI_HOST: process.env.LOKI_HOST || 'http://localhost:3100',
  KAFKA_BROKER_URL: process.env.KAFKA_BROKER_URL || 'localhost:9092',
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || 'http://localhost:3000',
  COMPANY_SERVICE_URL: process.env.COMPANY_SERVICE_URL || 'http://localhost:3001',
  JOB_SERVICE_URL: process.env.JOB_SERVICE_URL || 'http://localhost:3002',
} as const;