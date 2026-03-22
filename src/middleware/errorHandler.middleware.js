// src/middleware/errorHandler.middleware.js
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
  });

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors.map((e) => e.message),
    });
  }

  // Sequelize unique constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ success: false, message: 'Duplicate entry.' });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? 'Internal server error.' : err.message,
  });
};

module.exports = errorHandler;
