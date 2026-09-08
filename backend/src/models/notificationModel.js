function toSafeNotification(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderProfileImage: row.sender_profile_image,
    chatId: row.chat_id,
    messageId: row.message_id,
    type: row.type,
    content: row.content,
    isRead: row.is_read,
    createdAt: row.created_at,
  };
}

function toSafeNotificationList(rows) {
  return (rows || []).map(toSafeNotification);
}

module.exports = { toSafeNotification, toSafeNotificationList };
