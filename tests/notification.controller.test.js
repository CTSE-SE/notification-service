const notificationController = require('../src/controllers/notification.controller');
const notificationService = require('../src/services/notification.service');

jest.mock('../src/services/notification.service');

describe('NotificationController', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { id: 'user-1' },
      query: {},
      params: { id: 'notif-1' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
  });

  it('getMyNotifications returns paginated notifications', async () => {
    notificationService.getNotificationsByUser.mockResolvedValue({ notifications: [], total: 0, page: 1, totalPages: 0 });

    await notificationController.getMyNotifications(req, res, next);

    expect(notificationService.getNotificationsByUser).toHaveBeenCalledWith('user-1', { page: 1, limit: 20 });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('getNotificationById returns 404 when not found', async () => {
    notificationService.getNotificationById.mockResolvedValue(null);

    await notificationController.getNotificationById(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Notification not found.' });
  });

  it('getNotificationById returns notification when found', async () => {
    const notification = { id: 'notif-1' };
    notificationService.getNotificationById.mockResolvedValue(notification);

    await notificationController.getNotificationById(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: notification });
  });

  it('markAsRead returns 404 when not found', async () => {
    notificationService.markAsRead.mockResolvedValue(null);

    await notificationController.markAsRead(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('markAsRead returns notification when found', async () => {
    const notification = { id: 'notif-1', isRead: true };
    notificationService.markAsRead.mockResolvedValue(notification);

    await notificationController.markAsRead(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: notification });
  });

  it('markAllAsRead returns updated count', async () => {
    notificationService.markAllAsRead.mockResolvedValue(3);

    await notificationController.markAllAsRead(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, message: '3 notification(s) marked as read.' });
  });

  it('getUnreadCount returns count payload', async () => {
    notificationService.getUnreadCount.mockResolvedValue(7);

    await notificationController.getUnreadCount(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { unreadCount: 7 } });
  });

  it('forwards service errors to next()', async () => {
    const err = new Error('boom');
    notificationService.getUnreadCount.mockRejectedValue(err);

    await notificationController.getUnreadCount(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});
