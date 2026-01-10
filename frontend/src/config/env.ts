/**
 * Environment Configuration
 * Centralized access to environment variables with fallback values
 */

// Helper function to convert WebSocket URL to HTTP URL
const convertWsToHttp = (url: string): string => {
  if (url.startsWith('wss://')) {
    return url.replace('wss://', 'https://');
  }
  if (url.startsWith('ws://')) {
    return url.replace('ws://', 'http://');
  }
  return url;
};

// Helper function to extract base URL from WebSocket URL (removes /chat-socket or /notification-socket)
const extractBaseUrl = (url: string): string => {
  // Remove WebSocket-specific paths
  return url.replace(/\/chat-socket$/, '').replace(/\/notification-socket$/, '');
};

export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  USER_SERVICE_URL: import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:3000/api',
  COMPANY_SERVICE_URL: import.meta.env.VITE_COMPANY_SERVICE_URL || 'http://localhost:3002/api',
  JOB_SERVICE_URL: import.meta.env.VITE_JOB_SERVICE_URL || 'http://localhost:3001/api',
  SUBSCRIPTION_SERVICE_URL: import.meta.env.VITE_SUBSCRIPTION_SERVICE_URL || 'http://localhost:3003/api',
  // HTTP URLs for REST API calls - convert wss:// to https:// if needed
  CHAT_SERVICE_URL: (() => {
    const url = import.meta.env.VITE_CHAT_SERVICE_URL || 'http://localhost:4007';
    const httpUrl = convertWsToHttp(url);
    return extractBaseUrl(httpUrl);
  })(),
  NOTIFICATION_SERVICE_URL: (() => {
    const url = import.meta.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:4005';
    const httpUrl = convertWsToHttp(url);
    return extractBaseUrl(httpUrl);
  })(),
  // WebSocket URLs - use as-is for Socket.IO connections
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

