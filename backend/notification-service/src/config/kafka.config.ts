import { Kafka } from 'kafkajs';
import { AppConfig } from './app.config';

export const kafka = new Kafka({
  clientId:'notification-service',
  brokers: AppConfig.kafka.brokers,

});

export const consumer = kafka.consumer({
  groupId: 'notification-group',
});