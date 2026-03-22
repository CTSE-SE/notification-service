// src/controllers/notification.controller.js
const notificationService = require("../services/notification.service");

class NotificationController {
  /**
   * GET /api/notifications
   * Returns paginated notifications for the authenticated user.
   */
  async getMyNotifications(req, res, next) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const result = await notificationService.getNotificationsByUser(
        req.user.id,
        { page, limit },
      );
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notifications/:id
   * Returns a single notification by ID (owned by the requesting user).
   */
  async getNotificationById(req, res, next) {
    try {
      const notification = await notificationService.getNotificationById(
        req.params.id,
        req.user.id,
      );
      if (!notification) {
        return res
          .status(404)
          .json({ success: false, message: "Notification not found." });
      }
      res.status(200).json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/notifications/:id/read
   * Marks a single notification as read.
   */
  async markAsRead(req, res, next) {
    try {
      const notification = await notificationService.markAsRead(
        req.params.id,
        req.user.id,
      );
      if (!notification) {
        return res
          .status(404)
          .json({ success: false, message: "Notification not found." });
      }
      res.status(200).json({ success: true, data: notification });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/notifications/read-all
   * Marks ALL notifications as read for the authenticated user.
   */
  async markAllAsRead(req, res, next) {
    try {
      const updatedCount = await notificationService.markAllAsRead(req.user.id);
      res.status(200).json({
        success: true,
        message: `${updatedCount} notification(s) marked as read.`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/notifications/unread-count
   * Returns count of unread notifications for the authenticated user.
   */
  async getUnreadCount(req, res, next) {
    try {
      const count = await notificationService.getUnreadCount(req.user.id);
      res.status(200).json({ success: true, data: { unreadCount: count } });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
