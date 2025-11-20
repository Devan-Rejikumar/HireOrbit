import { Kafka } from 'kafkajs';

export const kafka = new Kafka({
    clientId: 'chat-service',
    brokers: [process.env.KAFKA_BROKERS || 'localhost:9092']
});

export const consumer = kafka.consumer({
    groupId: 'chat-group'
});