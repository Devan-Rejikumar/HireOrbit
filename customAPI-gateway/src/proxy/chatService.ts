import { ServiceProxyFactory } from './ServiceProxyFactory';
import { env } from '../config/env';

export const chatServiceProxy = ServiceProxyFactory.createProxy({
  serviceUrl: env.CHAT_SERVICE_URL,
  serviceName: 'chat'
});