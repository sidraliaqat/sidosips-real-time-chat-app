const { query } = require('../config/db');

async function create({ userId, senderId, chatId, messageId, type, content }) {
  const result = await query(
    `INSERT INTO notifications (user_id, sender_id, chat_id, message_id, type, content)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, senderId || null, chatId || null, messageId || null, type, content || null]
  );
  return result.rows[0];
}

async function getForUser(userId, { page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;

  const result = await query(
    `SELECT n.*, u.name AS sender_name, u.profile_image AS sender_profile_image
     FROM notifications n
     LEFT JOIN users u ON u.id = n.sender_id
     WHERE n.user_id = $1
     ORDER BY n.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  const countResult = await query(
    'SELECT COUNT(*)::int AS total, COALESCE(SUM((NOT is_read)::int), 0)::int AS unread FROM notifications WHERE user_id = $1',
    [userId]
  );

  return { rows: result.rows, total: countResult.rows[0].total, unread: countResult.rows[0].unread };
}

async function markAsRead(notificationId, userId) {
  const result = await query(
    `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *`,
    [notificationId, userId]
  );
  return result.rows[0] || null;
}

async function markAllAsRead(userId) {
  await query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE', [userId]);
}

module.exports = { create, getForUser, markAsRead, markAllAsRead };
