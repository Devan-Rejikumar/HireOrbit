// src/config/services.ts
export interface ServiceConfig {
  name: string;
  url: string;
  healthCheckPath: string;
  timeout: number;
  retries: number;
}

export interface ServicesConfig {
  [key: string]: ServiceConfig;
}

const services: ServicesConfig = {
  userService: {
    name: 'user-service',
    url: process.env.USER_SERVICE_URL || 'http://localhost:3000',
    healthCheckPath: '/health',
    timeout: 5000,
    retries: 3,
  },
  companyService: {
    name: 'company-service',
    url: process.env.COMPANY_SERVICE_URL || 'http://localhost:3001',
    healthCheckPath: '/health',
    timeout: 5000,
    retries: 3,
  },
  jobService: {
    name: 'job-service',
    url: process.env.JOB_SERVICE_URL || 'http://localhost:3002',
    healthCheckPath: '/health',
    timeout: 5000,
    retries: 3,
  },
  applicationService: {
    name: 'application-service',
    url: process.env.APPLICATION_SERVICE_URL || 'http://localhost:3004',
    healthCheckPath: '/health',
    timeout: 5000,
    retries: 3,
  },
};

export default services;