// tests/notification.service.test.js
const notificationService = require('../src/services/notification.service');
const Notification = require('../src/models/notification.model');
const emailService = require('../src/services/email.service');

// Mock the Sequelize model
jest.mock('../src/models/notification.model');
// Mock the email service
jest.mock('../src/services/email.service');

describe('NotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isAlreadyProcessed()', () => {
    it('returns true when a notification with the sqsMessageId exists', async () => {
      Notification.findOne.mockResolvedValue({ id: 'notif-1' });
      const result = await notificationService.isAlreadyProcessed('sqs-msg-123');
      expect(result).toBe(true);
      expect(Notification.findOne).toHaveBeenCalledWith({
        where: { sqsMessageId: 'sqs-msg-123' },
      });
    });

    it('returns false when no notification with the sqsMessageId exists', async () => {
      Notification.findOne.mockResolvedValue(null);
      const result = await notificationService.isAlreadyProcessed('sqs-msg-999');
      expect(result).toBe(false);
    });
  });

  describe('createNotification()', () => {
    it('creates and returns a notification record', async () => {
      const mockNotif = {
        id: 'notif-abc',
        userId: 'user-1',
        userEmail: 'test@example.com',
        type: 'order.placed',
        title: 'Order Confirmed',
        message: 'Your order #ORD-001 has been confirmed.',
      };
      Notification.create.mockResolvedValue(mockNotif);

      const result = await notificationService.createNotification({
        userId: 'user-1',
        userEmail: 'test@example.com',
        type: 'order.placed',
        title: 'Order Confirmed',
        message: 'Your order #ORD-001 has been confirmed.',
        orderId: 'ORD-001',
      });

      expect(Notification.create).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('notif-abc');
    });
  });

  describe('getUnreadCount()', () => {
    it('returns the count of unread notifications', async () => {
      Notification.count.mockResolvedValue(5);
      const count = await notificationService.getUnreadCount('user-1');
      expect(count).toBe(5);
      expect(Notification.count).toHaveBeenCalledWith({
        where: { userId: 'user-1', isRead: false },
      });
    });
  });

  describe('markAsRead()', () => {
    it('returns null when notification not found', async () => {
      Notification.findOne.mockResolvedValue(null);
      const result = await notificationService.markAsRead('notif-xyz', 'user-1');
      expect(result).toBeNull();
    });

    it('updates isRead to true and returns the notification', async () => {
      const mockUpdate = jest.fn().mockResolvedValue(true);
      Notification.findOne.mockResolvedValue({
        id: 'notif-1', isRead: false, update: mockUpdate,
      });
      const result = await notificationService.markAsRead('notif-1', 'user-1');
      expect(mockUpdate).toHaveBeenCalledWith({ isRead: true });
    });
  });

  describe('markAllAsRead()', () => {
    it('updates all unread notifications for a user', async () => {
      Notification.update.mockResolvedValue([3]);
      const count = await notificationService.markAllAsRead('user-1');
      expect(count).toBe(3);
      expect(Notification.update).toHaveBeenCalledWith(
        { isRead: true },
        { where: { userId: 'user-1', isRead: false } }
      );
    });
  });

  describe('sendEmailNotification()', () => {
    it('sends email and updates emailSent to true on success', async () => {
      emailService.sendEmail.mockResolvedValue('ses-msg-id-123');
      const mockUpdate = jest.fn().mockResolvedValue(true);
      const mockNotif = {
        id: 'notif-1',
        userEmail: 'test@example.com',
        type: 'order.placed',
        update: mockUpdate,
      };

      await notificationService.sendEmailNotification(mockNotif, { orderId: 'ORD-001' });

      expect(emailService.sendEmail).toHaveBeenCalledWith(
        'test@example.com', 'order.placed', { orderId: 'ORD-001' }
      );
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ emailSent: true })
      );
    });

    it('does not throw even if email sending fails', async () => {
      emailService.sendEmail.mockRejectedValue(new Error('SES error'));
      const mockUpdate = jest.fn();
      const mockNotif = {
        id: 'notif-1',
        userEmail: 'test@example.com',
        type: 'order.placed',
        update: mockUpdate,
      };

      await expect(
        notificationService.sendEmailNotification(mockNotif, { orderId: 'ORD-001' })
      ).resolves.not.toThrow();

      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});
