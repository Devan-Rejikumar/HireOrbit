import { ServiceProxyFactory } from './ServiceProxyFactory';
import { env } from '../config/env';

export const subscriptionServiceProxy = ServiceProxyFactory.createProxy({
  serviceUrl: env.SUBSCRIPTION_SERVICE_URL,
  serviceName: 'subscription'
});