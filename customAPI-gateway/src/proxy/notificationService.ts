import { ServiceProxyFactory } from './ServiceProxyFactory';
import { env } from '../config/env';

export const notificationServiceProxy = ServiceProxyFactory.createProxy({
  serviceUrl: env.NOTIFICATION_SERVICE_URL,
  serviceName: 'notification'
});