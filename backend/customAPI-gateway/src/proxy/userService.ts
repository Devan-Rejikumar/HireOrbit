import { ServiceProxyFactory } from './ServiceProxyFactory';
import { env } from '../config/env';

export const userServiceProxy = ServiceProxyFactory.createProxy({
  serviceUrl: env.USER_SERVICE_URL,
  serviceName: 'user'
});

export const userServiceMultipartProxy = ServiceProxyFactory.createMultipartProxy({
  serviceUrl: env.USER_SERVICE_URL,
  serviceName: 'user'
});