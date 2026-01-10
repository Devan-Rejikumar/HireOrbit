import { ServiceProxyFactory } from './ServiceProxyFactory';
import { AppConfig } from '../config/env';

export const jobServiceProxy = ServiceProxyFactory.createProxy({
  serviceUrl: AppConfig.services.job,
  serviceName: 'job'
});