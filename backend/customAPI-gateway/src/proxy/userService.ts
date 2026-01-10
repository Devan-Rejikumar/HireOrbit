import { ServiceProxyFactory } from './ServiceProxyFactory';
import { AppConfig } from '../config/env';
export const userServiceProxy = ServiceProxyFactory.createProxy({
  serviceUrl: AppConfig.services.user,
  serviceName: 'user'
});

export const userServiceMultipartProxy = ServiceProxyFactory.createMultipartProxy({
  serviceUrl: AppConfig.services.user,
  serviceName: 'user'
});