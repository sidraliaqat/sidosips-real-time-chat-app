import api from './api';

export async function searchUsers({ search = '', page = 1, limit = 20 } = {}) {
  const res = await api.get('/users', { params: { search, page, limit } });
  return res.data.data; // { users, pagination }
}

export async function getUserById(userId) {
  const res = await api.get(`/users/${userId}`);
  return res.data.data.user;
}

export async function updateProfile({ name, profileImage }) {
  const res = await api.put('/users/profile', { name, profileImage });
  return res.data.data.user;
}

export async function blockUser(userId) {
  await api.post(`/users/${userId}/block`);
}

export async function unblockUser(userId) {
  await api.delete(`/users/${userId}/block`);
}

export async function getBlockedUsers() {
  const res = await api.get('/users/me/blocked');
  return res.data.data.blockedUsers;
}

export async function setNickname(userId, nickname) {
  await api.put(`/users/${userId}/nickname`, { nickname });
}

export async function clearNickname(userId) {
  await api.delete(`/users/${userId}/nickname`);
}
