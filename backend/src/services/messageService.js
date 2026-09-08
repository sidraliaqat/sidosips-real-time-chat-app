const messageRepository = require('../repositories/messageRepository');
const chatRepository = require('../repositories/chatRepository');
const blockRepository = require('../repositories/blockRepository');
const userRepository = require('../repositories/userRepository');
const userService = require('./userService');
const { toSafeMessage, toSafeMessageList } = require('../models/messageModel');
const { toSafeUser } = require('../models/userModel');
const { AppError } = require('../middleware/errorMiddleware');
const { CHAT_TYPES } = require('../constants/chatTypes');

/**
 * Send a message. senderId ALWAYS comes from the authenticated
 * user/socket — never trust a sender id supplied by the client.
 */
async function sendMessage(senderId, { chatId, content, messageType, fileUrl, fileName }) {
  const isMember = await chatRepository.isParticipant(chatId, senderId);
  if (!isMember) {
    throw new AppError('You are not a member of this chat.', 403);
  }

  const chat = await chatRepository.findById(chatId);
  if (chat.type === CHAT_TYPES.PRIVATE) {
    const participants = await chatRepository.getParticipants(chatId);
    const other = participants.find((p) => Number(p.id) !== Number(senderId));
    if (other) {
      const blocked = await blockRepository.isBlockedBetween(senderId, other.id);
      if (blocked) {
        throw new AppError('You cannot send messages to this user.', 403);
      }
    }
  }

  if (messageType === 'text' && (!content || content.trim().length === 0)) {
    throw new AppError('Message content cannot be empty.', 422);
  }
  if (messageType !== 'text' && !fileUrl) {
    throw new AppError('File/image messages require a valid file.', 422);
  }

  const message = await messageRepository.create({
    chatId,
    senderId,
    content: content ? content.trim() : null,
    messageType,
    fileUrl,
    fileName,
  });

  // Re-fetch with sender name/avatar joined in for a consistent shape.
  const full = await messageRepository.findById(message.id);
  const senderInfo = await userRepository.findById(senderId);

  return toSafeMessage({
    ...full,
    sender_name: senderInfo.name,
    sender_profile_image: senderInfo.profile_image,
    read_count: 0,
  });
}

async function getChatMessages(chatId, userId, { page, limit, search }) {
  const isMember = await chatRepository.isParticipant(chatId, userId);
  if (!isMember) {
    throw new AppError('You are not a member of this chat.', 403);
  }

  const { rows, total } = await messageRepository.getChatMessages(chatId, { page, limit, search });
  const messages = toSafeMessageList(rows);

  // Apply the viewer's nicknames to each sender's displayed name (group chats especially).
  const senders = messages.map((m) => ({ id: m.senderId, name: m.senderName }));
  await userService.applyNicknames(userId, senders);
  senders.forEach((s, i) => {
    messages[i].senderName = s.name;
  });

  return {
    messages,
    pagination: {
      currentPage: page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      totalItems: total,
    },
  };
}

async function markDelivered(chatId, recipientId) {
  return messageRepository.markChatMessagesDelivered(chatId, recipientId);
}

/**
 * Marks everything unread in this chat as read for this user, and returns:
 *  - messageIds: every message that just got a new read receipt
 *  - fullyReadIds: the subset that are now read by EVERY other participant
 *    (this is what should visually flip a tick to "read" — for private chats
 *    these two lists are always the same since there's only one other person;
 *    for groups, fullyReadIds only grows once the last member has seen it).
 */
async function markRead(chatId, userId) {
  await require('./chatService').assertMembership(chatId, userId);
  return messageRepository.markChatMessagesRead(chatId, userId);
}

async function deleteMessage(messageId, requestingUserId) {
  const message = await messageRepository.findById(messageId);
  if (!message) throw new AppError('Message not found.', 404);

  if (Number(message.sender_id) !== Number(requestingUserId)) {
    throw new AppError('You can only delete your own messages.', 403);
  }

  await messageRepository.deleteMessage(messageId);
  return message;
}

/** "Clear chat" — permanently deletes every message in a chat for all participants. */
async function clearChat(chatId, requestingUserId) {
  const isMember = await chatRepository.isParticipant(chatId, requestingUserId);
  if (!isMember) {
    throw new AppError('You are not a member of this chat.', 403);
  }
  await messageRepository.deleteAllForChat(chatId);
}

/**
 * "Message info" — who has seen this message and who hasn't yet.
 * Only the message's sender can view this (matches common chat-app behavior).
 */
async function getMessageInfo(messageId, requestingUserId) {
  const message = await messageRepository.findById(messageId);
  if (!message) throw new AppError('Message not found.', 404);

  if (Number(message.sender_id) !== Number(requestingUserId)) {
    throw new AppError('Only the sender can view message info.', 403);
  }

  const [participantRows, readRows] = await Promise.all([
    chatRepository.getParticipants(message.chat_id),
    messageRepository.getReadReceipts(messageId),
  ]);

  const readByUserId = new Map(readRows.map((r) => [Number(r.user_id), r.read_at]));

  const others = participantRows.filter((p) => Number(p.id) !== Number(requestingUserId));

  const seenBy = [];
  const notSeenBy = [];
  for (const person of others) {
    const safePerson = toSafeUser({
      id: person.id,
      name: person.name,
      email: person.email,
      profile_image: person.profile_image,
    });
    const readAt = readByUserId.get(Number(person.id));
    if (readAt) {
      seenBy.push({ ...safePerson, readAt });
    } else {
      notSeenBy.push(safePerson);
    }
  }

  await userService.applyNicknames(requestingUserId, seenBy);
  await userService.applyNicknames(requestingUserId, notSeenBy);

  // Sort seen-by list by most-recently-read first, like most chat apps do.
  seenBy.sort((a, b) => new Date(b.readAt) - new Date(a.readAt));

  return { seenBy, notSeenBy, totalRecipients: others.length };
}

module.exports = {
  sendMessage,
  getChatMessages,
  markDelivered,
  markRead,
  deleteMessage,
  clearChat,
  getMessageInfo,
};
