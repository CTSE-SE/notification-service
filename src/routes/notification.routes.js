// src/routes/notification.routes.js
const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes below require a valid JWT
router.use(authenticate);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get count of unread notifications
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Unread notification count
 */
router.get('/unread-count', notificationController.getUnreadCount.bind(notificationController));

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get all notifications for authenticated user
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Paginated list of notifications
 */
router.get('/', notificationController.getMyNotifications.bind(notificationController));

/**
 * @swagger
 * /api/notifications/{id}:
 *   get:
 *     summary: Get a single notification by ID
 *     security: [{ bearerAuth: [] }]
 */
router.get('/:id', notificationController.getNotificationById.bind(notificationController));

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     security: [{ bearerAuth: [] }]
 */
router.put('/read-all', notificationController.markAllAsRead.bind(notificationController));

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark a notification as read
 *     security: [{ bearerAuth: [] }]
 */
router.put('/:id/read', notificationController.markAsRead.bind(notificationController));

module.exports = router;
