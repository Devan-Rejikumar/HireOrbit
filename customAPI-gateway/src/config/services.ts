import { env } from './env';
interface ServiceConfig {
  url: string;
  healthCheck: string;
  timeout: number;
  retries: number;
}
export const services = {
  user: {
    url: env.USER_SERVICE_URL,
    healthCheck: `${env.USER_SERVICE_URL}/health`,
    timeout: 5000,
    retries: 3
  } as ServiceConfig,
  
  company: {
    url: env.COMPANY_SERVICE_URL,
    healthCheck: `${env.COMPANY_SERVICE_URL}/health`,
    timeout: 5000,
    retries: 3
  } as ServiceConfig,
  
  job: {
    url: env.JOB_SERVICE_URL,
    healthCheck: `${env.JOB_SERVICE_URL}/health`,
    timeout: 5000,
    retries: 3
  } as ServiceConfig,
  
  application: {
    url: env.APPLICATION_SERVICE_URL,
    healthCheck: `${env.APPLICATION_SERVICE_URL}/health`,
    timeout: 5000,
    retries: 3
  } as ServiceConfig,

  notification: {
    url: env.NOTIFICATION_SERVICE_URL,
    healthCheck: `${env.NOTIFICATION_SERVICE_URL}/health`,
    timeout: 5000,
    retries: 3
  } as ServiceConfig,

  chat: {
    url: env.CHAT_SERVICE_URL,
    healthCheck: `${env.CHAT_SERVICE_URL}/health`,
    timeout: 5000,
    retries: 3
  } as ServiceConfig
};

export function getServiceUrl(serviceName: keyof typeof services): string {
  return services[serviceName].url;
}

export function getServiceHealthCheck(serviceName: keyof typeof services): string {
  return services[serviceName].healthCheck;
}

export function getServiceTimeout(serviceName: keyof typeof services): number {
  return services[serviceName].timeout;
}

export function getServiceRetries(serviceName: keyof typeof services): number {
  return services[serviceName].retries;
}

export const SERVICE_NAMES = {
  USER: 'user',
  COMPANY: 'company',
  JOB: 'job',
  APPLICATION: 'application',
  NOTIFICATION: 'notification',
  CHAT: 'chat'
} as const;

export default services;