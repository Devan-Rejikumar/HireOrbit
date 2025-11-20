import 'reflect-metadata';
import dotenv from 'dotenv';
import { app, server, io, initializeServices } from './server';
import { logger } from './utils/logger';

dotenv.config();

const PORT = process.env.PORT || 4005;

server.listen(PORT, async () => {
  logger.info(`Notification Service running on port ${PORT}`);
  logger.info(`WebSocket server ready for connections`);
  await initializeServices();
});

export { io };
