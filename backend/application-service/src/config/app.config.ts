/**
 * Application Configuration
 * Required values are validated for production
 * Optional integrations use sensible defaults
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
  PORT: process.env.PORT || '3004',
  SERVICE_NAME: process.env.SERVICE_NAME || 'application-service',

  // ===== Core service URLs =====
  JOB_SERVICE_URL: process.env.JOB_SERVICE_URL || process.env.API_GATEWAY_URL || 'http://localhost:3002',
  USER_SERVICE_URL: process.env.USER_SERVICE_URL || process.env.API_GATEWAY_URL || 'http://localhost:3009',
  SUBSCRIPTION_SERVICE_URL: process.env.SUBSCRIPTION_SERVICE_URL || 'http://localhost:3005',
  CHAT_SERVICE_URL: process.env.CHAT_SERVICE_URL || 'http://localhost:4007',
  API_GATEWAY_URL: process.env.API_GATEWAY_URL || 'http://localhost:4001',

  // ===== External WebSocket URLs (for frontend connections) =====
  // These are the external URLs that frontend clients use to connect via nginx proxy
  EXTERNAL_CHAT_SOCKET_URL: process.env.EXTERNAL_CHAT_SOCKET_URL || 'wss://api.devanarayanan.site/chat-socket',

  // ===== Optional =====
  FRONTEND_URL: process.env.FRONTEND_URL || 'https://ho.devanarayanan.site',
  LOKI_HOST: process.env.LOKI_HOST,

  // ===== HTTP =====
  HTTP_CLIENT_TIMEOUT: process.env.HTTP_CLIENT_TIMEOUT
    ? parseInt(process.env.HTTP_CLIENT_TIMEOUT, 10)
    : 5000,

  // ===== WebRTC =====
  STUN_SERVER_URL: process.env.STUN_SERVER_URL || 'stun:stun.l.google.com:19302',
  TURN_SERVER_URL: process.env.TURN_SERVER_URL || '',
  TURN_USERNAME: process.env.TURN_USERNAME || '',
  TURN_CREDENTIAL: process.env.TURN_CREDENTIAL || '',
} as const;
