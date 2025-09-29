import dotenv from 'dotenv';
import { app, initializeServices } from './app';


dotenv.config({ path: '.env' });

const PORT = process.env.PORT || 3004;

async function startServer(): Promise<void> {
  try {
    await initializeServices();
 
    app.listen(PORT, () => {
      console.log(`🚀 Application Service running on port ${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`📊 API Base URL: http://localhost:${PORT}/api/applications`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer().catch((error) => {
  console.error('❌ Unhandled error during server startup:', error);
  process.exit(1);
});