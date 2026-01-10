export const AppConfig = {
  service: {
    name: required('SERVICE_NAME'),
    version: required('SERVICE_VERSION'),
    nodeEnv: required('NODE_ENV'),
    port: number('PORT'),
  },

  frontend: {
    url: required('FRONTEND_URL'),
  },

  auth: {
    jwtSecret: required('JWT_SECRET'),
    jwtExpiresIn: required('JWT_EXPIRES_IN'),
    jwtRefreshExpiresIn: required('JWT_REFRESH_EXPIRES_IN'),
  },

  services: {
    user: required('USER_SERVICE_URL'),
    company: required('COMPANY_SERVICE_URL'),
    job: required('JOB_SERVICE_URL'),
    application: required('APPLICATION_SERVICE_URL'),
    subscription: required('SUBSCRIPTION_SERVICE_URL'),
    notification: required('NOTIFICATION_SERVICE_URL'),
    chat: required('CHAT_SERVICE_URL'),
  },

  rateLimit: {
    windowMs: number('RATE_LIMIT_WINDOW_MS'),
    maxRequests: number('RATE_LIMIT_MAX_REQUESTS'),
  },

  logging: {
    lokiHost: optional('LOKI_HOST'),
  },
} as const;



function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required environment variable: ${key}`);
  return v;
}

function optional(key: string): string | undefined {
  return process.env[key];
}

function number(key: string): number {
  const v = required(key);
  const n = Number(v);
  if (Number.isNaN(n)) throw new Error(`${key} must be a number`);
  return n;
}
