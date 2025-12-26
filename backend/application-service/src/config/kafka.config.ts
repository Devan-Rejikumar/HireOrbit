import { Kafka } from 'kafkajs';

// Parse broker string and validate
const getBrokers = (): string[] => {
  const brokerEnv = process.env.KAFKA_BROKERS;
  
  // Default to localhost:9092 if not set or invalid
  if (!brokerEnv || brokerEnv.trim() === '') {
    console.log('[Kafka] Using default broker: localhost:9092');
    return ['localhost:9092'];
  }
  
  // Validate the broker address has a valid port
  const brokers = brokerEnv.split(',').map(b => b.trim()).filter(b => {
    const parts = b.split(':');
    if (parts.length !== 2) return false;
    const port = parseInt(parts[1], 10);
    return !isNaN(port) && port > 0 && port < 65536;
  });
  
  if (brokers.length === 0) {
    console.warn(`[Kafka] Invalid KAFKA_BROKERS: "${brokerEnv}", using default: localhost:9092`);
    return ['localhost:9092'];
  }
  
  console.log(`[Kafka] Using brokers: ${brokers.join(', ')}`);
  return brokers;
};

export const kafka = new Kafka({
  clientId: 'application-service',
  brokers: getBrokers(),
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: 'application-group' });