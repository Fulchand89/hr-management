const http = require('http');
const app = require('./src/app');
const env = require('./src/config/env');
const logger = require('./src/config/logger');
const { testConnection, closeConnection } = require('./src/config/db');
const { initWebSocket } = require('./src/config/websocket');
const { initMailer } = require('./src/config/mailer');
const { initCronJobs, stopCronJobs } = require('./src/config/cron');
const { sequelize } = require('./src/models');

const server = http.createServer(app);

// Initialize WebSockets
const io = initWebSocket(server);

// Start Application Server
const startServer = async () => {
  try {
    logger.info(`Starting ${env.APP_NAME} in ${env.NODE_ENV} mode...`);

    // 1. Initialize Email Service
    await initMailer();

    // 2. Test Database Connection
    const dbConnected = await testConnection();

    if (dbConnected) {
      logger.info('Database connection verified. Tables managed via migrations.');
    }

    // 3. Initialize Scheduled Cron Jobs
    initCronJobs();

    // 4. Start HTTP & WebSocket Server
    server.listen(env.PORT, () => {
      logger.success(`Server is running at: http://localhost:${env.PORT}`);
      logger.info(`API Base URL: http://localhost:${env.PORT}/api/v1`);
      logger.info(`Health check: http://localhost:${env.PORT}/api/v1/health`);
      logger.info(`WebSocket server active on port: ${env.PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful Shutdown Handler
const gracefulShutdown = async (signal) => {
  logger.warn(`Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP & WebSocket server closed.');

    // Stop cron jobs
    stopCronJobs();

    // Close database connection
    await closeConnection();

    logger.success('Graceful shutdown completed.');
    process.exit(0);
  });

  // Force shutdown after 10s timeout
  setTimeout(() => {
    logger.error('Shutdown timed out. Forcing process exit.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection at:', promise);
  logger.error('Reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', error);
  process.exit(1);
});

startServer();

module.exports = { server, io };
