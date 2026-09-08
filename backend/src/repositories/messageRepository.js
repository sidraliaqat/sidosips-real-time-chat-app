const { query } = require('../config/db');

async function create({ chatId, senderId, content, messageType, fileUrl, fileName }) {
  const result = await query(
    `INSERT INTO messages (chat_id, sender_id, content, message_type, file_url, file_name, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'sent')
     RETURNING *`,
    [chatId, senderId, content || null, messageType || 'text', fileUrl || null, fileName || null]
  );
  return result.rows[0];
}

async function findById(messageId) {
  const result = await query('SELECT * FROM messages WHERE id = $1', [messageId]);
  return result.rows[0] || null;
}

/** Paginated message history for a chat, newest-first pages, oldest-first within page. */
async function getChatMessages(chatId, { page = 1, limit = 20, search = '' } = {}) {
  const offset = (page - 1) * limit;

  const params = [chatId];
  let searchClause = '';
  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    searchClause = `AND LOWER(m.content) LIKE $${params.length}`;
  }
  params.push(limit, offset);

  const result = await query(
    `SELECT m.*, u.name AS sender_name, u.profile_image AS sender_profile_image,
            (SELECT COUNT(*)::int FROM message_reads mr WHERE mr.message_id = m.id) AS read_count
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.chat_id = $1 ${searchClause}
     ORDER BY m.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const countResult = await query(
    `SELECT COUNT(*)::int AS total FROM messages m WHERE m.chat_id = $1 ${searchClause}`,
    search ? [chatId, `%${search.toLowerCase()}%`] : [chatId]
  );

  return {
    rows: result.rows.reverse(), // oldest-first for rendering
    total: countResult.rows[0].total,
  };
}

async function updateStatus(messageId, status) {
  const result = await query(
    `UPDATE messages SET status = $2 WHERE id = $1 RETURNING *`,
    [messageId, status]
  );
  return result.rows[0];
}

/** Bump status sent -> delivered for all of a recipient's unseen messages in a chat. */
async function markChatMessagesDelivered(chatId, recipientId) {
  const result = await query(
    `UPDATE messages
     SET status = 'delivered'
     WHERE chat_id = $1 AND sender_id <> $2 AND status = 'sent'
     RETURNING id`,
    [chatId, recipientId]
  );
  return result.rows.map((r) => r.id);
}

async function getUnreadMessageIds(chatId, userId) {
  const result = await query(
    `SELECT m.id FROM messages m
     WHERE m.chat_id = $1 AND m.sender_id <> $2
       AND NOT EXISTS (SELECT 1 FROM message_reads mr WHERE mr.message_id = m.id AND mr.user_id = $2)`,
    [chatId, userId]
  );
  return result.rows.map((r) => r.id);
}

async function addReadReceipt(messageId, userId) {
  const result = await query(
    `INSERT INTO message_reads (message_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (message_id, user_id) DO NOTHING
     RETURNING *`,
    [messageId, userId]
  );
  return result.rows[0] || null;
}

/**
 * Marks all currently-unread messages in a chat as read for this user.
 * A message's overall `status` only flips to 'read' once EVERY other
 * participant of the chat has read it — for private chats (one other
 * participant) that's immediate, exactly like before; for group chats,
 * the tick only turns "read" once the last member has seen it.
 *
 * Returns:
 *  - messageIds: every message that just got a new read receipt from this user
 *  - fullyReadIds: the subset now read by every other participant
 */
async function markChatMessagesRead(chatId, userId) {
  const unreadIds = await getUnreadMessageIds(chatId, userId);
  if (unreadIds.length === 0) return { messageIds: [], fullyReadIds: [] };

  for (const messageId of unreadIds) {
    await addReadReceipt(messageId, userId);
  }

  const result = await query(
    `SELECT m.id,
            (SELECT COUNT(*)::int FROM chat_participants cp
              WHERE cp.chat_id = m.chat_id AND cp.user_id <> m.sender_id) AS total_recipients,
            (SELECT COUNT(*)::int FROM message_reads mr WHERE mr.message_id = m.id) AS read_count
     FROM messages m
     WHERE m.id = ANY($1::bigint[])`,
    [unreadIds]
  );

  const fullyReadIds = result.rows
    .filter((r) => r.total_recipients > 0 && r.read_count >= r.total_recipients)
    .map((r) => r.id);

  if (fullyReadIds.length > 0) {
    await query(`UPDATE messages SET status = 'read' WHERE id = ANY($1::bigint[])`, [fullyReadIds]);
  }

  return { messageIds: unreadIds, fullyReadIds };
}

/** All read receipts for a single message, newest first — powers the "message info" (seen by) view. */
async function getReadReceipts(messageId) {
  const result = await query(
    `SELECT mr.user_id, mr.read_at
     FROM message_reads mr
     WHERE mr.message_id = $1
     ORDER BY mr.read_at DESC`,
    [messageId]
  );
  return result.rows;
}

async function deleteMessage(messageId) {
  const result = await query('DELETE FROM messages WHERE id = $1 RETURNING *', [messageId]);
  return result.rows[0] || null;
}

/** Deletes every message in a chat (used by the "Clear chat" feature). */
async function deleteAllForChat(chatId) {
  await query('DELETE FROM messages WHERE chat_id = $1', [chatId]);
}

module.exports = {
  create,
  findById,
  getChatMessages,
  updateStatus,
  markChatMessagesDelivered,
  getUnreadMessageIds,
  addReadReceipt,
  markChatMessagesRead,
  getReadReceipts,
  deleteMessage,
  deleteAllForChat,
};
