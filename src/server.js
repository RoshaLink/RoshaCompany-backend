import app from './app.js';
import { config } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { seedDefaultAdmins } from './services/auth.service.js';
import { logger } from './utils/logger.js';

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Seed default admin accounts (bella, milad, morteza, sohrab, mina)
  await seedDefaultAdmins();

  // Start HTTP Server
  const server = app.listen(config.port, '0.0.0.0', () => {
    logger.info(`=================================================`);
    logger.info(` RoshaLink Backend Server running in [${config.nodeEnv}] mode`);
    logger.info(` Port: http://localhost:${config.port} (0.0.0.0)`);
    logger.info(` Health check: http://localhost:${config.port}/api/health`);
    logger.info(` Auth login:   http://localhost:${config.port}/api/auth/login`);
    logger.info(` Lead capture: http://localhost:${config.port}/api/lead`);
    logger.info(`=================================================`);
  });

  // Handle graceful shutdown
  const shutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });

    // Force shutdown after 10s if dangling connections exist
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception thrown:', error);
    process.exit(1);
  });
};

startServer();
