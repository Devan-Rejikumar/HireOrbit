import { ServiceProxyFactory } from './ServiceProxyFactory';
import { AppConfig } from '../config/env';

export const companyServiceProxy = ServiceProxyFactory.createProxy({
  serviceUrl: AppConfig.services.company,
  serviceName: 'company'
});

export const companyServiceMultipartProxy = ServiceProxyFactory.createMultipartProxy({
  serviceUrl: AppConfig.services.company,
  serviceName: 'company'
});