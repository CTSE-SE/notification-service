// src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * Middleware: verifies JWT token from Authorization header.
 * Attaches decoded user payload to req.user.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role, iat, exp }
    next();
  } catch (error) {
    logger.warn('JWT verification failed.', { error: error.message });
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token has expired.' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }
};

/**
 * Middleware: verifies the internal API key for service-to-service calls.
 */
const authenticateInternal = (req, res, next) => {
  const internalKey = req.headers['x-internal-key'];

  if (!internalKey || internalKey !== process.env.INTERNAL_API_KEY) {
    return res.status(403).json({ success: false, message: 'Forbidden.' });
  }
  next();
};

module.exports = { authenticate, authenticateInternal };
