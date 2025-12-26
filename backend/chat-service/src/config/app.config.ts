/**
 * Application Configuration
 * Non-sensitive configuration values with safe defaults
 * Sensitive values (secrets, passwords) should be in .env file
 */
import "dotenv-flow/config";

export const AppConfig = {
  PORT: process.env.PORT || '4007',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  LOKI_HOST: process.env.LOKI_HOST || 'http://localhost:3100',
  API_GATEWAY_URL: process.env.API_GATEWAY_URL || 'http://localhost:4000',
  APPLICATION_SERVICE_URL: process.env.APPLICATION_SERVICE_URL || 'http://localhost:3004',
  KAFKA_BROKERS: process.env.KAFKA_BROKERS || 'localhost:9092',
  MONGODB_URI: process.env.MONGODB_URI || '',
} as const;

console.log(AppConfig);
