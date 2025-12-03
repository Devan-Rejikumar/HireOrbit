import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
dotenv.config();

import app from './app';
import { AppConfig } from './config/app.config';
// Logger removed - using console.log instead

const PORT = AppConfig.PORT;

app.listen(PORT, () => {
  console.log(`Subscription Service running on port ${PORT}`);
});