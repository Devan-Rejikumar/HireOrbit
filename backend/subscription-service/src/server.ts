import dotenv from 'dotenv';

dotenv.config();

import app from './app';
import { AppConfig } from './config/app.config';


const PORT = AppConfig.PORT;

app.listen(PORT, () => {
  console.log(`Subscription Service running on port ${PORT}`);
});