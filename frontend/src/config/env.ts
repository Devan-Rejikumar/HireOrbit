/**
 * Environment Configuration
 * Centralized access to environment variables with fallback values
 */

export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  USER_SERVICE_URL: import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:3000/api',
  COMPANY_SERVICE_URL: import.meta.env.VITE_COMPANY_SERVICE_URL || 'http://localhost:3002/api',
  JOB_SERVICE_URL: import.meta.env.VITE_JOB_SERVICE_URL || 'http://localhost:3001/api',
  SUBSCRIPTION_SERVICE_URL: import.meta.env.VITE_SUBSCRIPTION_SERVICE_URL || 'http://localhost:3003/api',
  // HTTP API calls for chat and notification go through API Gateway
  CHAT_SERVICE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  NOTIFICATION_SERVICE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  // WebSocket URLs - dedicated Socket.IO endpoints
  CHAT_SOCKET_URL: import.meta.env.VITE_CHAT_SERVICE_URL || 'ws://localhost:4007',
  NOTIFICATION_SOCKET_URL: import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'ws://localhost:4005',
  FRONTEND_URL: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:5173',
  FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY || '',
  FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID || '',
} as const;

