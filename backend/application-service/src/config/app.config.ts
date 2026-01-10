/**
 * Application Configuration
 * Required values are validated
 * Optional integrations are allowed to be undefined
 */

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

export const AppConfig = {
  // ===== Runtime =====
  PORT: requireEnv('PORT'),
  SERVICE_NAME: requireEnv('SERVICE_NAME'),

  // ===== Core service URLs (REQUIRED) =====
  JOB_SERVICE_URL: requireEnv('JOB_SERVICE_URL'),
  USER_SERVICE_URL: requireEnv('USER_SERVICE_URL'),
  SUBSCRIPTION_SERVICE_URL: requireEnv('SUBSCRIPTION_SERVICE_URL'),
  CHAT_SERVICE_URL: requireEnv('CHAT_SERVICE_URL'),
  API_GATEWAY_URL: requireEnv('API_GATEWAY_URL'),

  // ===== Optional =====
  FRONTEND_URL: process.env.FRONTEND_URL,
  LOKI_HOST: process.env.LOKI_HOST,

  // ===== HTTP =====
  HTTP_CLIENT_TIMEOUT: process.env.HTTP_CLIENT_TIMEOUT
    ? parseInt(process.env.HTTP_CLIENT_TIMEOUT, 10)
    : 5000,

  // ===== WebRTC (OPTIONAL BY DESIGN) =====
  STUN_SERVER_URL: process.env.STUN_SERVER_URL,
  TURN_SERVER_URL: process.env.TURN_SERVER_URL,
  TURN_USERNAME: process.env.TURN_USERNAME,
  TURN_CREDENTIAL: process.env.TURN_CREDENTIAL,
} as const;

