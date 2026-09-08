const notificationRepository = require('../repositories/notificationRepository');
const { toSafeNotification, toSafeNotificationList } = require('../models/notificationModel');
const { AppError } = require('../middleware/errorMiddleware');

async function createNotification({ userId, senderId, chatId, messageId, type, content }) {
  const row = await notificationRepository.create({ userId, senderId, chatId, messageId, type, content });
  return toSafeNotification(row);
}

async function getForUser(userId, { page = 1, limit = 20 } = {}) {
  const { rows, total, unread } = await notificationRepository.getForUser(userId, { page, limit });
  return {
    notifications: toSafeNotificationList(rows),
    unreadCount: unread,
    pagination: {
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      totalItems: total,
    },
  };
}

async function markAsRead(notificationId, userId) {
  const row = await notificationRepository.markAsRead(notificationId, userId);
  if (!row) throw new AppError('Notification not found.', 404);
  return toSafeNotification(row);
}

async function markAllAsRead(userId) {
  await notificationRepository.markAllAsRead(userId);
}

module.exports = { createNotification, getForUser, markAsRead, markAllAsRead };
