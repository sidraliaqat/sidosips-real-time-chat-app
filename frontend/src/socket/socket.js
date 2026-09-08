import { io } from 'socket.io-client';
import { getToken } from '../utils/token';

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

/**
 * Creates (once) and returns the single shared Socket.IO connection.
 * The connection is authenticated with the current JWT on every (re)connect.
 * Call disconnectSocket() on logout to fully tear it down.
 */
export function getSocket() {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    autoConnect: false,
    auth: (cb) => cb({ token: getToken() }),
    transports: ['websocket', 'polling'],
  });

  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
  return s;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket.removeAllListeners();
    socket = null;
  }
}
