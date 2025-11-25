import app from './app';
import { AppConfig } from './config/app.config';
import { logger } from './utils/logger';

const PORT = AppConfig.PORT;

app.listen(PORT, () => {
  logger.info(`Company Service running on port ${PORT}`);
}); 