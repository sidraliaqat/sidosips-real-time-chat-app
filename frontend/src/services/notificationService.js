import api from './api';

export async function getNotifications({ page = 1, limit = 20 } = {}) {
  const res = await api.get('/notifications', { params: { page, limit } });
  return res.data.data; // { notifications, unreadCount, pagination }
}

export async function markNotificationRead(id) {
  const res = await api.put(`/notifications/${id}/read`);
  return res.data.data.notification;
}

export async function markAllNotificationsRead() {
  await api.put('/notifications/read-all');
}
