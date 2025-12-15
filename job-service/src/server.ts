import app from './app';
import { logger } from './utils/logger';
import { AppConfig } from './config/app.config';
import * as cron from 'node-cron';
import container from './config/inversify.config';
import TYPES from './config/types';
import { JobUnlistCronService } from './services/implementations/JobUnlistCronService';

const PORT = parseInt(AppConfig.PORT, 10);

// Initialize cron job for auto-unlisting expired jobs
// Runs daily at midnight (00:00)
const jobUnlistCronService = container.get<JobUnlistCronService>(TYPES.JobUnlistCronService);

cron.schedule('0 0 * * *', async () => {
  logger.info('Running scheduled job: unlistExpiredJobs');
  try {
    await jobUnlistCronService.unlistExpiredJobs();
  } catch (error) {
    logger.error('Error in scheduled unlistExpiredJobs:', error);
  }
});

logger.info('Cron job scheduled: unlistExpiredJobs will run daily at midnight');

app.listen(PORT, () => {
  logger.info(`Job Service running on port ${PORT}`);
});
