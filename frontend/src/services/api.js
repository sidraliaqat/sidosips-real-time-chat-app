import axios from 'axios';
import { getToken, clearAuth } from '../utils/token';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearAuth();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/** Turns any axios error into a friendly, predictable string. */
export function getErrorMessage(error) {
  if (error?.response?.data?.errors?.length) {
    return error.response.data.errors.join(', ');
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) return error.message;
  return 'Something went wrong. Please try again.';
}

/** Resolves an uploaded file's relative URL (e.g. "/uploads/x.png") to an absolute one. */
export function resolveFileUrl(url) {
  if (!url) return url;
  if (url.startsWith('http')) return url;
  return `${SERVER_BASE_URL}${url}`;
}

export default api;
