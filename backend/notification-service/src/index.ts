import 'reflect-metadata';
import { server, io, initializeServices } from './server';
import { logger } from './utils/logger';
import { AppConfig } from './config/app.config';

async function start() {
  logger.info('notification-service starting');

  await initializeServices();

  server.listen(AppConfig.service.port, () => {
    logger.info(
      `notification-service listening on ${AppConfig.service.port}`
    );
  });
}

start().catch(err => {
  logger.error('Failed to start notification-service', err);
  process.exit(1);
});

export { io };
