import mongoose from 'mongoose';
import env from './env.js';
import { seedFlowTemplates } from '../seeds/seedTemplates.js';
import { seedSystemDesignTemplates } from '../seeds/seedSystemDesignTemplates.js';
import { seedSystemDesignPractice } from '../seeds/seedSystemDesignPractice.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);

    // Seed default workflow templates
    await seedFlowTemplates();
    // Seed system design starter templates and practice problems
    await seedSystemDesignTemplates();
    await seedSystemDesignPractice();

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed (SIGINT)');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed (SIGTERM)');
      process.exit(0);
    });
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
