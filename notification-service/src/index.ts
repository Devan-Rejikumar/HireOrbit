import 'reflect-metadata';
import dotenv from 'dotenv';
import { server, io, initializeServices } from './server';
import { logger } from './utils/logger';
import { AppConfig } from './config/app.config';
import { NOTIFICATION_ROUTES } from './constants/routes';

dotenv.config();

const PORT = parseInt(AppConfig.PORT, 10);

server.listen(PORT, async () => {
  logger.info(`Notification Service running on port ${PORT}`);
  logger.info('WebSocket server ready for connections');
  logger.info(`API Base URL: http://localhost:${PORT}${NOTIFICATION_ROUTES.API_BASE_PATH}`);
  await initializeServices();
});

export { io };
