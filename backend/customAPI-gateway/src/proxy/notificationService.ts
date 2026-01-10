import { ServiceProxyFactory } from './ServiceProxyFactory';
import { AppConfig } from '../config/env';

export const notificationServiceProxy = ServiceProxyFactory.createProxy({
  serviceUrl: AppConfig.services.notification,
  serviceName: 'notification'
});