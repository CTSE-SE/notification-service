// src/index.js
require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/database');
const sqsConsumer = require('./services/sqsConsumer.service');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3001;

const start = async () => {
  try {
    // 1. Connect to database
    await connectDB();

    // 2. Start HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`Notification Service running on port ${PORT}`, {
        env: process.env.NODE_ENV,
        port: PORT,
      });
    });

    // 3. Start SQS consumer (only if queue URL is configured)
    if (process.env.SQS_QUEUE_URL) {
      sqsConsumer.start();
    } else {
      logger.warn('SQS_QUEUE_URL not set – SQS consumer will not start.');
    }

    // ─── Graceful Shutdown ──────────────────────────────────────────
    const shutdown = async (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      sqsConsumer.stop();
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start Notification Service:', error);
    process.exit(1);
  }
};

start();
