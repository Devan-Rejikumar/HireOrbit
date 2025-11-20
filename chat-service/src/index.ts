import 'reflect-metadata';
import dotenv from 'dotenv';
import { server, initializeServices } from './server';

dotenv.config();

const PORT = process.env.PORT || 4007;

server.listen(PORT, async () => {
  console.log(`Chat Service running on port ${PORT}`);
  console.log('WebSocket server ready for connections');
  await initializeServices();
});

