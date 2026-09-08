const notificationService = require('../services/notificationService');

async function getNotifications(req, res, next) {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await notificationService.getForUser(req.user.id, { page, limit });
    res.status(200).json({ success: true, message: 'Notifications fetched', data: result });
  } catch (err) {
    next(err);
  }
}

async function markAsRead(req, res, next) {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Notification marked as read', data: { notification } });
  } catch (err) {
    next(err);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    await notificationService.markAllAsRead(req.user.id);
    res.status(200).json({ success: true, message: 'All notifications marked as read', data: {} });
  } catch (err) {
    next(err);
  }
}

module.exports = { getNotifications, markAsRead, markAllAsRead };
