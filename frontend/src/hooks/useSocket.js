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

    // Connect to your backend port
    const socketInstance = io('http://localhost:8000');
    setSocket(socketInstance);

    // Join both room varieties supported by your backend index.js
    socketInstance.emit('joinRoom', userId.toString());
    socketInstance.emit('joinUserRoom', userId.toString());

    // Listen for customer tracking milestones
    socketInstance.on('orderStatusUpdated', (data) => {
      console.log("📨 Global Catch: Customer Order Status Updated", data);
      if (location.pathname !== '/my-orders') {
        setUserBadgeCount((prev) => prev + 1);
      }
    });

    // Listen for incoming kitchen alerts
    socketInstance.on('newOrderReceived', (incomingOrder) => {
      console.log("🍳 Global Catch: Kitchen Received New Order", incomingOrder);
      if (location.pathname !== '/dashboard/orders') {
        setOwnerBadgeCount((prev) => prev + 1);
      }
    });

    // Cleanup on unmount or user swap
    return () => {
      socketInstance.off('orderStatusUpdated');
      socketInstance.off('newOrderReceived');
      socketInstance.disconnect();
    };
  }, [userId]);

  // Reset notification badges instantly when the user visits the respective dashboard screen
  useEffect(() => {
    if (location.pathname === '/my-orders') setUserBadgeCount(0);
    if (location.pathname === '/dashboard/orders') setOwnerBadgeCount(0);
  }, [location.pathname]);

  // Return the live socket instance alongside your badge tracking streams
  return { socket, userBadgeCount, ownerBadgeCount };
};