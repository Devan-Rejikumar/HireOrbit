import { ServiceProxyFactory } from './ServiceProxyFactory';
import { env } from '../config/env';

export const jobServiceProxy = ServiceProxyFactory.createProxy({
  serviceUrl: env.JOB_SERVICE_URL,
  serviceName: 'job'
});