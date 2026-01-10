import { ServiceProxyFactory } from './ServiceProxyFactory';
import { AppConfig } from '../config/env';

export const subscriptionServiceProxy = ServiceProxyFactory.createProxy({
  serviceUrl: AppConfig.services.subscription,
  serviceName: 'subscription'
});