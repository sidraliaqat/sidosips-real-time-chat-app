const { query, getClient } = require('../config/db');

/** Find an existing private chat between exactly these two users, if any. */
async function findPrivateChatBetween(userIdA, userIdB) {
  const result = await query(
    `SELECT c.*
     FROM chats c
     WHERE c.type = 'private'
       AND EXISTS (SELECT 1 FROM chat_participants cp WHERE cp.chat_id = c.id AND cp.user_id = $1)
       AND EXISTS (SELECT 1 FROM chat_participants cp WHERE cp.chat_id = c.id AND cp.user_id = $2)
       AND (SELECT COUNT(*) FROM chat_participants cp WHERE cp.chat_id = c.id) = 2
     LIMIT 1`,
    [userIdA, userIdB]
  );
  return result.rows[0] || null;
}

/** Create a private chat + add both participants, inside one transaction. */
async function createPrivateChat(creatorId, otherUserId) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const chatResult = await client.query(
      `INSERT INTO chats (type, created_by) VALUES ('private', $1) RETURNING *`,
      [creatorId]
    );
    const chat = chatResult.rows[0];

    await client.query(
      `INSERT INTO chat_participants (chat_id, user_id, is_admin) VALUES ($1, $2, TRUE), ($1, $3, FALSE)`,
      [chat.id, creatorId, otherUserId]
    );

    await client.query('COMMIT');
    return chat;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Create a group chat + admin + members, inside one transaction. */
async function createGroupChat(creatorId, { name, image, memberIds }) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const chatResult = await client.query(
      `INSERT INTO chats (type, name, image, created_by) VALUES ('group', $1, $2, $3) RETURNING *`,
      [name, image || null, creatorId]
    );
    const chat = chatResult.rows[0];

    const uniqueMemberIds = [...new Set(memberIds.filter((id) => id !== creatorId))];

    const values = [`(${chat.id}, ${creatorId}, TRUE)`];
    const params = [];
    let paramIndex = 1;
    const placeholders = [];

    for (const memberId of uniqueMemberIds) {
      placeholders.push(`($1, $${paramIndex + 1}, FALSE)`);
      params.push(memberId);
      paramIndex += 1;
    }

    // Insert creator first
    await client.query(
      `INSERT INTO chat_participants (chat_id, user_id, is_admin) VALUES ($1, $2, TRUE)`,
      [chat.id, creatorId]
    );

    // Insert remaining members (if any)
    if (uniqueMemberIds.length > 0) {
      const memberPlaceholders = uniqueMemberIds
        .map((_, i) => `($1, $${i + 2}, FALSE)`)
        .join(', ');
      await client.query(
        `INSERT INTO chat_participants (chat_id, user_id, is_admin) VALUES ${memberPlaceholders}`,
        [chat.id, ...uniqueMemberIds]
      );
    }

    await client.query('COMMIT');
    return chat;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function findById(chatId) {
  const result = await query('SELECT * FROM chats WHERE id = $1', [chatId]);
  return result.rows[0] || null;
}

async function isParticipant(chatId, userId) {
  const result = await query(
    'SELECT 1 FROM chat_participants WHERE chat_id = $1 AND user_id = $2',
    [chatId, userId]
  );
  return result.rowCount > 0;
}

async function isAdmin(chatId, userId) {
  const result = await query(
    'SELECT 1 FROM chat_participants WHERE chat_id = $1 AND user_id = $2 AND is_admin = TRUE',
    [chatId, userId]
  );
  return result.rowCount > 0;
}

async function getParticipants(chatId) {
  const result = await query(
    `SELECT u.id, u.name, u.email, u.profile_image, u.is_online, u.last_seen, cp.is_admin, cp.joined_at
     FROM chat_participants cp
     JOIN users u ON u.id = cp.user_id
     WHERE cp.chat_id = $1
     ORDER BY cp.is_admin DESC, u.name ASC`,
    [chatId]
  );
  return result.rows;
}

/** All chats a user belongs to, with last message preview + unread count. */
async function getUserChats(userId) {
  const result = await query(
    `SELECT
        c.id, c.type, c.name, c.image, c.created_by, c.created_at, c.updated_at,
        lm.content AS last_message_content,
        lm.message_type AS last_message_type,
        lm.created_at AS last_message_at,
        lm.sender_id AS last_message_sender_id,
        COALESCE(unread.count, 0)::int AS unread_count,
        op.id AS other_user_id,
        op.name AS other_user_name,
        op.profile_image AS other_user_profile_image,
        op.is_online AS other_user_is_online,
        op.last_seen AS other_user_last_seen
     FROM chats c
     JOIN chat_participants my ON my.chat_id = c.id AND my.user_id = $1
     LEFT JOIN LATERAL (
        SELECT content, message_type, created_at, sender_id
        FROM messages m
        WHERE m.chat_id = c.id
        ORDER BY m.created_at DESC
        LIMIT 1
     ) lm ON TRUE
     LEFT JOIN LATERAL (
        SELECT COUNT(*)::int AS count
        FROM messages m
        WHERE m.chat_id = c.id
          AND m.sender_id <> $1
          AND NOT EXISTS (
            SELECT 1 FROM message_reads mr WHERE mr.message_id = m.id AND mr.user_id = $1
          )
     ) unread ON TRUE
     LEFT JOIN LATERAL (
        SELECT u.id, u.name, u.profile_image, u.is_online, u.last_seen
        FROM chat_participants cp2
        JOIN users u ON u.id = cp2.user_id
        WHERE cp2.chat_id = c.id AND cp2.user_id <> $1 AND c.type = 'private'
        LIMIT 1
     ) op ON TRUE
     ORDER BY COALESCE(lm.created_at, c.created_at) DESC`,
    [userId]
  );
  return result.rows;
}

async function addMember(chatId, userId) {
  const result = await query(
    `INSERT INTO chat_participants (chat_id, user_id, is_admin)
     VALUES ($1, $2, FALSE)
     ON CONFLICT (chat_id, user_id) DO NOTHING
     RETURNING *`,
    [chatId, userId]
  );
  return result.rows[0] || null;
}

async function removeMember(chatId, userId) {
  const result = await query(
    'DELETE FROM chat_participants WHERE chat_id = $1 AND user_id = $2 RETURNING *',
    [chatId, userId]
  );
  return result.rows[0] || null;
}

async function updateGroup(chatId, { name, image }) {
  const result = await query(
    `UPDATE chats SET name = COALESCE($2, name), image = COALESCE($3, image)
     WHERE id = $1 RETURNING *`,
    [chatId, name ?? null, image ?? null]
  );
  return result.rows[0];
}

async function deleteChat(chatId) {
  await query('DELETE FROM chats WHERE id = $1', [chatId]);
}

async function countParticipants(chatId) {
  const result = await query('SELECT COUNT(*)::int AS count FROM chat_participants WHERE chat_id = $1', [chatId]);
  return result.rows[0].count;
}

module.exports = {
  findPrivateChatBetween,
  createPrivateChat,
  createGroupChat,
  findById,
  isParticipant,
  isAdmin,
  getParticipants,
  getUserChats,
  addMember,
  removeMember,
  updateGroup,
  deleteChat,
  countParticipants,
};
