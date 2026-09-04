import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    logger.info('MongoDB connection already established.');
    return;
  }

  const targetType = config.useProdDb ? 'PRODUCTION (Atlas Cloud)' : 'LOCAL (127.0.0.1)';

  try {
    const conn = await mongoose.connect(config.mongodbUri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    logger.info(`[MongoDB] Connected successfully to ${targetType}: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB runtime connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting reconnection...');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected.');
      isConnected = true;
    });
  } catch (error) {
    const maskedUri = config.mongodbUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
    logger.error(`Failed to connect to MongoDB [${targetType}] at ${maskedUri}:`, error.message);
    if (config.isProduction) {
      process.exit(1);
    } else {
      logger.warn('Running in development mode without active MongoDB connection. API will attempt reconnection on requests.');
    }
  }
};

export const disconnectDB = async () => {
  if (isConnected) {
    await mongoose.connection.close();
    isConnected = false;
    logger.info('MongoDB connection closed gracefully.');
  }
};
