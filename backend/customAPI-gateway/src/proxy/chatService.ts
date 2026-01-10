import { ServiceProxyFactory } from './ServiceProxyFactory';
import { AppConfig } from '../config/env';

export const chatServiceProxy = ServiceProxyFactory.createProxy({
  serviceUrl: AppConfig.services.chat,
  serviceName: 'chat'
});