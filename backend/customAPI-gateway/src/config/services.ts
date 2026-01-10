import { AppConfig } from './env';
interface ServiceConfig {
  url: string;
  healthCheck: string;
  timeout: number;
  retries: number;
}
export const services = {
  user: {
    url: AppConfig.services.user,
    healthCheck: `${AppConfig.services.user}/health`,
    timeout: 5000,
    retries: 3
  } as ServiceConfig,
  
  company: {
    url: AppConfig.services.company,
    healthCheck: `${AppConfig.services.company}/health`,
    timeout: 5000,
    retries: 3
  } as ServiceConfig,
  
  job: {
    url: AppConfig.services.job,
    healthCheck: `${AppConfig.services.job}/health`,
    timeout: 5000,
    retries: 3
  } as ServiceConfig,
  
  application: {
    url: AppConfig.services.application,
    healthCheck: `${AppConfig.services.application}/health`,
    timeout: 5000,
    retries: 3
  } as ServiceConfig,

  notification: {
    url: AppConfig.services.notification,
    healthCheck: `${AppConfig.services.notification}/health`,
    timeout: 5000,
    retries: 3
  } as ServiceConfig,

  chat: {
    url: AppConfig.services.chat,
    healthCheck: `${AppConfig.services.chat}/health`,
    timeout: 5000,
    retries: 3
  } as ServiceConfig,

  subscription: {
    url: AppConfig.services.subscription,
    healthCheck: `${AppConfig.services.subscription}/health`,
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
  CHAT: 'chat',
  SUBSCRIPTION: 'subscription'
} as const;

export default services;