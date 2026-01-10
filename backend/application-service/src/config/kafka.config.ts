import { Kafka } from 'kafkajs';

const broker = process.env.KAFKA_BROKER;

if (!broker) {
  throw new Error('KAFKA_BROKER is not defined');
}

const kafka = new Kafka({
  clientId: 'application-service',
  brokers: [broker],
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({
  groupId: 'application-service-group',
});
