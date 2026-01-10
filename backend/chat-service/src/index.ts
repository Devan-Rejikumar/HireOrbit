import 'reflect-metadata';
import { server, initializeServices } from './server';
import { AppConfig } from './config/app.config';
import { logger } from './utils/logger';

async function start() {
  logger.info('chat-service starting');
  await initializeServices(); 
  server.listen(AppConfig.service.port, () => {
    logger.info(`chat-service listening on ${AppConfig.service.port}`);
  });
}

start().catch(err => {
  logger.error('Failed to start chat-service', err);
  process.exit(1);
});
