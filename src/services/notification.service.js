// src/services/notification.service.js
const Notification = require('../models/notification.model');
const emailService = require('./email.service');
const logger = require('../utils/logger');

class NotificationService {
  /**
   * Check if an SQS message has already been processed (idempotency).
   */
  async isAlreadyProcessed(sqsMessageId) {
    const existing = await Notification.findOne({ where: { sqsMessageId } });
    return !!existing;
  }

  /**
   * Persist a new notification record to the database.
   */
  async createNotification(data) {
    const notification = await Notification.create({
      userId: data.userId,
      userEmail: data.userEmail,
      type: data.type,
      title: data.title,
      message: data.message,
      orderId: data.orderId || null,
      sqsMessageId: data.sqsMessageId || null,
      metadata: data.metadata || null,
      emailSent: false,
    });
    logger.info('Notification created in DB.', { id: notification.id, type: data.type });
    return notification;
  }

  /**
   * Send email for a notification and update the record on success.
   */
  async sendEmailNotification(notification, templateData) {
    try {
      await emailService.sendEmail(notification.userEmail, notification.type, templateData);
      await notification.update({ emailSent: true, emailSentAt: new Date() });
      logger.info('Email sent and notification record updated.', { id: notification.id });
    } catch (error) {
      logger.error('Email sending failed; notification saved but email not sent.', {
        notificationId: notification.id,
        error: error.message,
      });
      // Don't re-throw — we still successfully stored the notification
    }
  }

  /**
   * Get all notifications for a specific user (paginated).
   */
  async getNotificationsByUser(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const { count, rows } = await Notification.findAndCountAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset,
    });
    return {
      notifications: rows,
      total: count,
      page: parseInt(page, 10),
      totalPages: Math.ceil(count / limit),
    };
  }

  /**
   * Mark a notification as read.
   */
  async markAsRead(notificationId, userId) {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId },
    });
    if (!notification) return null;
    await notification.update({ isRead: true });
    return notification;
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId) {
    const [updatedCount] = await Notification.update(
      { isRead: true },
      { where: { userId, isRead: false } }
    );
    return updatedCount;
  }

  /**
   * Count unread notifications for a user.
   */
  async getUnreadCount(userId) {
    return Notification.count({ where: { userId, isRead: false } });
  }

  /**
   * Get a single notification by ID (with ownership check).
   */
  async getNotificationById(notificationId, userId) {
    return Notification.findOne({ where: { id: notificationId, userId } });
  }
}

module.exports = new NotificationService();
