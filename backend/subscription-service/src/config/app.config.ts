/**
 * Subscription Service Configuration
 * Fail fast if required environment variables are missing
 */

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const parseNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number for environment variable: ${key}`);
  }
  return parsed;
};

export const AppConfig = {

  PORT: requireEnv('PORT'),
  SERVICE_NAME: requireEnv('SERVICE_NAME'),
  DATABASE_URL: requireEnv('DATABASE_URL'),
  KAFKA_BROKER: requireEnv('KAFKA_BROKER'),
  USER_SERVICE_URL: requireEnv('USER_SERVICE_URL'),
  COMPANY_SERVICE_URL: requireEnv('COMPANY_SERVICE_URL'),
  JOB_SERVICE_URL: requireEnv('JOB_SERVICE_URL'),
  FRONTEND_URL: requireEnv('FRONTEND_URL'),
  STRIPE_SECRET_KEY: requireEnv('STRIPE_SECRET_KEY'),
  STRIPE_PUBLISHABLE_KEY: requireEnv('STRIPE_PUBLISHABLE_KEY'),
  STRIPE_WEBHOOK_SECRET: requireEnv('STRIPE_WEBHOOK_SECRET'),
  JSON_BODY_SIZE_LIMIT_MB: parseNumber('JSON_BODY_SIZE_LIMIT_MB', 20),
  URL_ENCODED_BODY_SIZE_LIMIT_MB: parseNumber('URL_ENCODED_BODY_SIZE_LIMIT_MB', 10),
  LOKI_HOST: process.env.LOKI_HOST,
} as const;
