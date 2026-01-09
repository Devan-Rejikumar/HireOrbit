import { Kafka } from 'kafkajs';
import { AppConfig } from './app.config';

export const kafka = new Kafka({
  clientId: 'chat-service',
  brokers: [AppConfig.KAFKA_BROKERS],
});

export const consumer = kafka.consumer({
  groupId: 'chat-group',
});