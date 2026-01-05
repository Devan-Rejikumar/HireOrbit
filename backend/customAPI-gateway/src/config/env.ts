import "dotenv-flow/config";
interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  USER_SERVICE_URL: string;
  COMPANY_SERVICE_URL: string;
  JOB_SERVICE_URL: string;
  APPLICATION_SERVICE_URL: string;
  NOTIFICATION_SERVICE_URL: string;
  CHAT_SERVICE_URL: string;
  SUBSCRIPTION_SERVICE_URL: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  CORS_ORIGIN: string;
  LOG_LEVEL: string;
  LOG_FILE: string;
  LOKI_URL?: string;
}

function getEnvConfig(): EnvConfig {
  const requiredVars = [
    'JWT_SECRET',
    'USER_SERVICE_URL',
    'COMPANY_SERVICE_URL',
    'JOB_SERVICE_URL',
    'APPLICATION_SERVICE_URL',
    'NOTIFICATION_SERVICE_URL',
    'CHAT_SERVICE_URL',
    'SUBSCRIPTION_SERVICE_URL'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  return {
    PORT: parseInt(process.env.PORT || '4000', 10),
    NODE_ENV: process.env.NODE_ENV || 'development',
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

    USER_SERVICE_URL: process.env.USER_SERVICE_URL!,
    COMPANY_SERVICE_URL: process.env.COMPANY_SERVICE_URL!,
    JOB_SERVICE_URL: process.env.JOB_SERVICE_URL!,
    APPLICATION_SERVICE_URL: process.env.APPLICATION_SERVICE_URL!,
    NOTIFICATION_SERVICE_URL: process.env.NOTIFICATION_SERVICE_URL!,
    CHAT_SERVICE_URL: process.env.CHAT_SERVICE_URL!,
    SUBSCRIPTION_SERVICE_URL: process.env.SUBSCRIPTION_SERVICE_URL!,
    RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
    LOG_FILE: process.env.LOG_FILE || 'logs/gateway.log',
    LOKI_URL: process.env.LOKI_URL || 'http://localhost:3100',
  };
}


export const env = getEnvConfig();
export const {
  PORT,
  NODE_ENV,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  USER_SERVICE_URL,
  COMPANY_SERVICE_URL,
  JOB_SERVICE_URL,
  APPLICATION_SERVICE_URL,
  NOTIFICATION_SERVICE_URL,
  CHAT_SERVICE_URL,
  SUBSCRIPTION_SERVICE_URL,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS,
  CORS_ORIGIN,
  LOG_LEVEL,
  LOG_FILE
} = env;