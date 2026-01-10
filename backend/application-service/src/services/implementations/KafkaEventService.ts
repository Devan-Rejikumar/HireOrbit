import { IEventService } from '../interfaces/IEventService';
import { producer, consumer } from '../../config/kafka.config';
import { logger } from '../../utils/logger';

export class KafkaEventService implements IEventService {
  private isProducerConnected = false;

  async publish<T>(event: string, data: T): Promise<void> {
    if (!this.isProducerConnected) {
      logger.warn('Producer not connected, attempting to connect...');
      try {
        await producer.connect();
        this.isProducerConnected = true;
        logger.info('Producer reconnected successfully');
      } catch (connectError) {
        logger.error('Failed to reconnect producer:', connectError);
        throw connectError;
      }
    }

    try {
      logger.info(`Publishing event to topic: ${event}`, { data });
      await producer.send({
        topic: event,
        messages: [{ value: JSON.stringify(data) }],
      });
      logger.info(`Event published successfully to topic: ${event}`);
    } catch (error) {
      logger.error(`Failed to publish event to topic: ${event}`, error);
      this.isProducerConnected = false;
      throw error;
    }
  }

  async subscribe<T>(event: string, handler: (data: T) => Promise<void>): Promise<void> {
    await consumer.subscribe({ topic: event });
    await consumer.run({
      eachMessage: async ({ message }: { message: any }) => {

        const data = JSON.parse(message.value?.toString() || '{}') as T;
        await handler(data);
      },
    });
  }

  async start(): Promise<void> {
    try {
      logger.info('Connecting Kafka producer...');
      await producer.connect();
      this.isProducerConnected = true;
      logger.info('Kafka producer connected successfully');
    } catch (error) {
      logger.error('Failed to connect Kafka producer:', error);
      throw error;
    }

    try {
      logger.info('Connecting Kafka consumer...');
      await consumer.connect();
      logger.info('Kafka consumer connected successfully');
    } catch (error) {
      logger.error('Failed to connect Kafka consumer:', error);
    }
  }

  async stop(): Promise<void> {
    try {
      await producer.disconnect();
      this.isProducerConnected = false;
      logger.info('Kafka producer disconnected');
    } catch (error) {
      logger.error('Error disconnecting producer:', error);
    }

    try {
      await consumer.disconnect();
      logger.info('Kafka consumer disconnected');
    } catch (error) {
      logger.error('Error disconnecting consumer:', error);
    }
  }
}