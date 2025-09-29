import { Kafka } from 'kafkajs';

export const kafka = new Kafka({
    clientId: 'application-service',
    brokers: ['localhost:9002']
})

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: 'application-group'});