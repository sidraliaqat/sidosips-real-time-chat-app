const { toSafeUser } = require('./userModel');

function toSafeChat(row, extra = {}) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    image: row.image,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastMessage: row.last_message_content
      ? {
          content: row.last_message_content,
          messageType: row.last_message_type,
          createdAt: row.last_message_at,
          senderId: row.last_message_sender_id,
        }
      : null,
    unreadCount: row.unread_count ?? 0,
    otherParticipant: row.other_user_id
      ? {
          id: row.other_user_id,
          name: row.other_user_name,
          profileImage: row.other_user_profile_image,
          isOnline: row.other_user_is_online,
          lastSeen: row.other_user_last_seen,
        }
      : null,
    ...extra,
  };
}

function toSafeParticipant(row) {
  return {
    ...toSafeUser(row),
    isAdmin: row.is_admin,
    joinedAt: row.joined_at,
  };
}

module.exports = { toSafeChat, toSafeParticipant };
