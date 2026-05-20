// hooks/useSocket.js
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const useSocket = (userId) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const socketInstance = io('http://localhost:8000');
    setSocket(socketInstance);

    socketInstance.emit('joinUserRoom', userId);

    return () => {
      socketInstance.disconnect();
    };
  }, [userId]);

  return socketInstance;
};