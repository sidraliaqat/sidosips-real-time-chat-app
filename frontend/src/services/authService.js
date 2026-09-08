import api from './api';

export async function registerUser({ name, email, password, confirmPassword }) {
  const res = await api.post('/auth/register', { name, email, password, confirmPassword });
  return res.data.data; // { user, token }
}

export async function loginUser({ email, password }) {
  const res = await api.post('/auth/login', { email, password });
  return res.data.data; // { user, token }
}

export async function fetchCurrentUser() {
  const res = await api.get('/auth/me');
  return res.data.data.user;
}
