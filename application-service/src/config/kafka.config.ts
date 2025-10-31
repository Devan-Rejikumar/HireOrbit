import { Kafka } from 'kafkajs';

export const kafka = new Kafka({
    clientId: 'application-service',
    brokers: [process.env.KAFKA_BROKERS || 'localhost:9092']
})

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: 'application-group'});