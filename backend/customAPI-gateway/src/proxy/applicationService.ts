import { ServiceProxyFactory } from './ServiceProxyFactory';
import { env } from '../config/env';

export const applicationServiceProxy = ServiceProxyFactory.createProxy({
  serviceUrl: env.APPLICATION_SERVICE_URL,
  serviceName: 'application'
});

export const applicationServiceMultipartProxy = ServiceProxyFactory.createMultipartProxy({
  serviceUrl: env.APPLICATION_SERVICE_URL,
  serviceName: 'application'
});