import dotenv from 'dotenv';
import { app, initializeServices } from './app';
import { logger } from './utils/logger';
dotenv.config({ path: '.env' });

const PORT = process.env.PORT || 3004;

async function startServer(): Promise<void> {
  try {
    await initializeServices();
 
    app.listen(PORT, () => {
      logger.info(`Application Service running on port ${PORT}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API Base URL: http://localhost:${PORT}/api/applications`);
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