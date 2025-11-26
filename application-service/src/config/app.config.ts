/**
 * Application Configuration
 * Non-sensitive configuration values with safe defaults
 * Sensitive values (secrets, passwords) should be in .env file
 */

export const AppConfig = {
  PORT: process.env.PORT || '3004',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  LOKI_HOST: process.env.LOKI_HOST || 'http://localhost:3100',
  JOB_SERVICE_URL: process.env.JOB_SERVICE_URL || process.env.API_GATEWAY_URL || 'http://localhost:3002',
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || process.env.API_GATEWAY_URL || 'http://localhost:3000',
  API_GATEWAY_URL: process.env.API_GATEWAY_URL || 'http://localhost:4001',
  HTTP_CLIENT_TIMEOUT: parseInt(process.env.HTTP_CLIENT_TIMEOUT || '5000', 10),
} as const;

