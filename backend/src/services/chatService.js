const chatRepository = require('../repositories/chatRepository');
const userRepository = require('../repositories/userRepository');
const userService = require('./userService');
const { toSafeChat, toSafeParticipant } = require('../models/chatModel');
const { AppError } = require('../middleware/errorMiddleware');
const { CHAT_TYPES } = require('../constants/chatTypes');

async function getOrCreatePrivateChat(currentUserId, otherUserId) {
  if (Number(currentUserId) === Number(otherUserId)) {
    throw new AppError('You cannot start a chat with yourself.', 400);
  }

  const otherUser = await userRepository.findById(otherUserId);
  if (!otherUser) {
    throw new AppError('User not found.', 404);
  }

  let chat = await chatRepository.findPrivateChatBetween(currentUserId, otherUserId);
  if (!chat) {
    chat = await chatRepository.createPrivateChat(currentUserId, otherUserId);
  }

  return getChatById(chat.id, currentUserId);
}

async function createGroupChat(creatorId, { name, image, memberIds }) {
  // Validate all member ids actually exist before committing.
  const members = await userRepository.findByIds(memberIds);
  if (members.length !== new Set(memberIds).size) {
    throw new AppError('One or more selected members do not exist.', 400);
  }

  const chat = await chatRepository.createGroupChat(creatorId, { name, image, memberIds });
  return getChatById(chat.id, creatorId);
}

async function getUserChats(userId) {
  const rows = await chatRepository.getUserChats(userId);
  const chats = rows.map((row) => toSafeChat(row));

  // Apply the viewer's private nicknames to each private chat's "other participant".
  const otherParticipants = chats.map((c) => c.otherParticipant).filter(Boolean);
  if (otherParticipants.length > 0) {
    await userService.applyNicknames(userId, otherParticipants);
  }

  return chats;
}

async function getChatById(chatId, requestingUserId) {
  const chat = await chatRepository.findById(chatId);
  if (!chat) {
    throw new AppError('Chat not found.', 404);
  }

  const isMember = await chatRepository.isParticipant(chatId, requestingUserId);
  if (!isMember) {
    throw new AppError('You are not a member of this chat.', 403);
  }

  const participantRows = await chatRepository.getParticipants(chatId);
  const participants = participantRows.map(toSafeParticipant);
  await userService.applyNicknames(requestingUserId, participants);

  return toSafeChat(chat, { participants });
}

async function assertMembership(chatId, userId) {
  const isMember = await chatRepository.isParticipant(chatId, userId);
  if (!isMember) {
    throw new AppError('You are not a member of this chat.', 403);
  }
}

async function addMember(chatId, requestingUserId, newUserId) {
  const chat = await chatRepository.findById(chatId);
  if (!chat) throw new AppError('Chat not found.', 404);
  if (chat.type !== CHAT_TYPES.GROUP) throw new AppError('Only groups support adding members.', 400);

  const isAdmin = await chatRepository.isAdmin(chatId, requestingUserId);
  if (!isAdmin) throw new AppError('Only the group admin can add members.', 403);

  const newUser = await userRepository.findById(newUserId);
  if (!newUser) throw new AppError('User not found.', 404);

  await chatRepository.addMember(chatId, newUserId);
  return getChatById(chatId, requestingUserId);
}

async function removeMember(chatId, requestingUserId, targetUserId) {
  const chat = await chatRepository.findById(chatId);
  if (!chat) throw new AppError('Chat not found.', 404);
  if (chat.type !== CHAT_TYPES.GROUP) throw new AppError('Only groups support removing members.', 400);

  const isAdmin = await chatRepository.isAdmin(chatId, requestingUserId);
  if (!isAdmin) throw new AppError('Only the group admin can remove members.', 403);

  if (Number(targetUserId) === Number(chat.created_by)) {
    throw new AppError('The group creator cannot be removed.', 400);
  }

  await chatRepository.removeMember(chatId, targetUserId);
  return getChatById(chatId, requestingUserId);
}

async function leaveGroup(chatId, userId) {
  const chat = await chatRepository.findById(chatId);
  if (!chat) throw new AppError('Chat not found.', 404);
  if (chat.type !== CHAT_TYPES.GROUP) throw new AppError('You can only leave group chats.', 400);

  await assertMembership(chatId, userId);
  await chatRepository.removeMember(chatId, userId);

  const remaining = await chatRepository.countParticipants(chatId);
  if (remaining === 0) {
    await chatRepository.deleteChat(chatId);
  }
}

async function updateGroup(chatId, requestingUserId, { name, image }) {
  const chat = await chatRepository.findById(chatId);
  if (!chat) throw new AppError('Chat not found.', 404);
  if (chat.type !== CHAT_TYPES.GROUP) throw new AppError('Only groups can be updated this way.', 400);

  const isAdmin = await chatRepository.isAdmin(chatId, requestingUserId);
  if (!isAdmin) throw new AppError('Only the group admin can update group details.', 403);

  await chatRepository.updateGroup(chatId, { name, image });
  return getChatById(chatId, requestingUserId);
}

async function deleteChat(chatId, requestingUserId) {
  const chat = await chatRepository.findById(chatId);
  if (!chat) throw new AppError('Chat not found.', 404);

  await assertMembership(chatId, requestingUserId);

  if (chat.type === CHAT_TYPES.GROUP) {
    const isAdmin = await chatRepository.isAdmin(chatId, requestingUserId);
    if (!isAdmin) throw new AppError('Only the group admin can delete this group.', 403);
  }

  await chatRepository.deleteChat(chatId);
}

module.exports = {
  getOrCreatePrivateChat,
  createGroupChat,
  getUserChats,
  getChatById,
  assertMembership,
  addMember,
  removeMember,
  leaveGroup,
  updateGroup,
  deleteChat,
};
