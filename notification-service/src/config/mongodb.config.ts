import mongoose from 'mongoose';

export const connectMongoDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://devanrejikumar007_db_user:devan@cluster0.r3yinx6.mongodb.net/';
    
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error(' MongoDB connection failed:', error);
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