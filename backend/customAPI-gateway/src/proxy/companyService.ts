import { ServiceProxyFactory } from './ServiceProxyFactory';
import { env } from '../config/env';

export const companyServiceProxy = ServiceProxyFactory.createProxy({
  serviceUrl: env.COMPANY_SERVICE_URL,
  serviceName: 'company'
});

export const companyServiceMultipartProxy = ServiceProxyFactory.createMultipartProxy({
  serviceUrl: env.COMPANY_SERVICE_URL,
  serviceName: 'company'
});