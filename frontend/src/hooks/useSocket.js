import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useLocation } from 'react-router-dom';

export const useSocket = (userId) => {
  const [socket, setSocket] = useState(null);
  const [userBadgeCount, setUserBadgeCount] = useState(0);
  const [ownerBadgeCount, setOwnerBadgeCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    if (!userId) return;

    const socketInstance = io('http://localhost:8000');
    setSocket(socketInstance);

    socketInstance.emit('joinRoom', userId.toString());
    socketInstance.emit('joinUserRoom', userId.toString());

    socketInstance.on('orderStatusUpdated', (data) => {
      console.log("📨 Global Catch: Customer Order Status Updated", data);
      if (location.pathname !== '/my-orders') {
        setUserBadgeCount((prev) => prev + 1);
      }
    });

    socketInstance.on('newOrderReceived', (incomingOrder) => {
      console.log("🍳 Global Catch: Kitchen Received New Order", incomingOrder);
      if (location.pathname !== '/dashboard/orders') {
        setOwnerBadgeCount((prev) => prev + 1);
      }
    });

    return () => {
      socketInstance.off('orderStatusUpdated');
      socketInstance.off('newOrderReceived');
      socketInstance.disconnect();
    };
  }, [userId]);

  useEffect(() => {
    if (location.pathname === '/my-orders') setUserBadgeCount(0);
    if (location.pathname === '/dashboard/orders') setOwnerBadgeCount(0);
  }, [location.pathname]);

  return { socket, userBadgeCount, ownerBadgeCount };
};
