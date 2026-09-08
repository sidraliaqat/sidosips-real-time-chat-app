import api from './api';

export async function getChats() {
  const res = await api.get('/chats');
  return res.data.data.chats;
}

export async function getChatById(chatId) {
  const res = await api.get(`/chats/${chatId}`);
  return res.data.data.chat;
}

export async function createPrivateChat(userId) {
  const res = await api.post('/chats', { userId });
  return res.data.data.chat;
}

export async function createGroupChat({ name, image, memberIds }) {
  const res = await api.post('/chats/group', { name, image, memberIds });
  return res.data.data.chat;
}

export async function updateGroup(chatId, { name, image }) {
  const res = await api.put(`/chats/${chatId}`, { name, image });
  return res.data.data.chat;
}

export async function addMember(chatId, userId) {
  const res = await api.post(`/chats/${chatId}/members`, { userId });
  return res.data.data.chat;
}

export async function removeMember(chatId, userId) {
  const res = await api.delete(`/chats/${chatId}/members/${userId}`);
  return res.data.data.chat;
}

export async function leaveGroup(chatId) {
  await api.post(`/chats/${chatId}/leave`);
}

export async function deleteChat(chatId) {
  await api.delete(`/chats/${chatId}`);
}
