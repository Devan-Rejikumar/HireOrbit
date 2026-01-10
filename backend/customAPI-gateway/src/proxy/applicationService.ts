import { ServiceProxyFactory } from './ServiceProxyFactory';
import { AppConfig } from '../config/env';

export const applicationServiceProxy = ServiceProxyFactory.createProxy({
  serviceUrl: AppConfig.services.application,
  serviceName: 'application'
});

export const applicationServiceMultipartProxy = ServiceProxyFactory.createMultipartProxy({
  serviceUrl: AppConfig.services.application,
  serviceName: 'application'
});