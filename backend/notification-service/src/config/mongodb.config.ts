import mongoose from 'mongoose';
import { AppConfig } from './app.config';

export const connectMongoDB = async (): Promise<void> => {
  try {
    const mongoUri = AppConfig.mongo.uri;

    
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not configured. Please set it in .env file.');
    }
    
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('MongoDB connection failed:', errorMessage);
    process.exit(1);
  }
};

export const disconnectMongoDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log(' MongoDB disconnected');
  } catch (error) {
    console.error(' MongoDB disconnection failed:', error);
  }
};