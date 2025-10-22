import { IEventService } from '../interface/IEventService';
import { producer, consumer } from '../../config/kafka.config';

export class KafkaEventService implements IEventService {
  async publish<T>(event: string, data: T): Promise<void> {
    await producer.send({
      topic: event,
      messages: [{ value: JSON.stringify(data) }]
    });
  }

  async subscribe<T>(event: string, handler: (data: T) => Promise<void>): Promise<void> {
    await consumer.subscribe({ topic: event });
    await consumer.run({
      eachMessage: async ({ message }) => {
        const data = JSON.parse(message.value?.toString() || '{}') as T;
        await handler(data);
      }
    });
  }

  async start(): Promise<void> {
    await producer.connect();
    await consumer.connect();
  }

  async stop(): Promise<void> {
    await producer.disconnect();
    await consumer.disconnect();
  }
}