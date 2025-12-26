import { app, initializeServices } from './app';
import { logger } from './utils/logger';
import { AppConfig } from './config/app.config';
import { APPLICATION_ROUTES } from './constants/routes';

const PORT = parseInt(AppConfig.PORT, 10);

async function startServer(): Promise<void> {
  try {
    await initializeServices();
 
    app.listen(PORT, () => {
      logger.info(`Application Service running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API Base URL: http://localhost:${PORT}${APPLICATION_ROUTES.API_BASE_PATH}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer().catch((error) => {
  logger.error('Unhandled error during server startup:', error);
  process.exit(1);
});