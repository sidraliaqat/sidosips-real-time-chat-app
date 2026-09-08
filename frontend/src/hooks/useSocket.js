import { useEffect, useState } from 'react';
import { getSocket } from '../socket/socket';

/**
 * Gives components access to the single shared socket instance,
 * plus a live `connected` boolean for UI (e.g. a "reconnecting..." banner).
 */
export function useSocket() {
  const socket = getSocket();
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, [socket]);

  return { socket, connected };
}
