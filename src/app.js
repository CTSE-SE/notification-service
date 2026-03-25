// src/app.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const notificationRoutes = require('./routes/notification.routes');
const errorHandler = require('./middleware/errorHandler.middleware');
const logger = require('./utils/logger');

const app = express();

// ─── Security Headers ──────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginEmbedderPolicy: false,
    originAgentCluster: false,
  })
);

// ─── CORS ──────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : '*',
  methods: ['GET', 'PUT', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Internal-Key'],
}));

// ─── Body Parser ───────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── HTTP Request Logger ───────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) },
}));

// ─── Rate Limiting ─────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api/', limiter);

// ─── Health Check (no auth required – used by ECS) ────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    service: 'notification-service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// ─── Swagger API Docs ──────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ─── API Routes ───────────────────────────────────────────────────
app.use('/api/notifications', notificationRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ─── Global Error Handler ─────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
