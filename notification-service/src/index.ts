import 'reflect-metadata';
import dotenv from 'dotenv';
import { app, server, io, initializeServices } from './server';

dotenv.config();

const PORT = process.env.PORT || 4005;

server.listen(PORT, async () => {
  console.log(`Notification Service running on port ${PORT}`);
  console.log(`WebSocket server ready for connections`);
  await initializeServices();
});

export { io };
