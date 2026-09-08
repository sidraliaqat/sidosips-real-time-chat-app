function toSafeMessage(row) {
  if (!row) return null;
  return {
    id: row.id,
    chatId: row.chat_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    senderProfileImage: row.sender_profile_image,
    content: row.content,
    messageType: row.message_type,
    fileUrl: row.file_url,
    fileName: row.file_name,
    status: row.status,
    readCount: row.read_count ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSafeMessageList(rows) {
  return (rows || []).map(toSafeMessage);
}

module.exports = { toSafeMessage, toSafeMessageList };
