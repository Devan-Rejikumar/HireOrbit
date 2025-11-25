import app from './app';
import {logger} from './utils/logger';
import { AppConfig } from './config/app.config';

const PORT = AppConfig.PORT;
app.listen(PORT, () => {
  logger.info(`Server running on port http://localhost:${PORT}`);
});