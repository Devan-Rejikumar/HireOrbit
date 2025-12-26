/**
 * Application Configuration
 * Non-sensitive configuration values with safe defaults
 * Sensitive values (secrets, passwords) should be in .env file
 */
import "dotenv-flow/config";

export const AppConfig = {
  PORT: process.env.PORT || '3002',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  LOKI_HOST: process.env.LOKI_HOST || 'http://localhost:3100',
  JOB_SUGGESTION_MIN_LIMIT: parseInt(process.env.JOB_SUGGESTION_MIN_LIMIT || '10', 10),
  JOB_SUGGESTION_MAX_LIMIT: parseInt(process.env.JOB_SUGGESTION_MAX_LIMIT || '50', 10),
  SUBSCRIPTION_SERVICE_URL: process.env.SUBSCRIPTION_SERVICE_URL || process.env.API_GATEWAY_URL || 'http://localhost:4000',
} as const;

console.log('AppConfig', AppConfig);
