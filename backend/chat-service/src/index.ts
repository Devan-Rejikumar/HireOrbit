import 'reflect-metadata';
import dotenv from 'dotenv';
import { server, initializeServices } from './server';
import { AppConfig } from './config/app.config';
import { CHAT_ROUTES } from './constants/routes';

dotenv.config();

const PORT = parseInt(AppConfig.PORT, 10);

server.listen(PORT, async () => {
  console.log(`Chat Service running on port ${PORT}`);
  console.log('WebSocket server ready for connections');
  console.log(`API Base URL: http://localhost:${PORT}${CHAT_ROUTES.API_BASE_PATH}`);
  await initializeServices();
});

