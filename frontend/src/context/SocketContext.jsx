import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { userData } = useSelector((state) => state.user || {});
  const location = useLocation();
  const [socket, setSocket] = useState(null);
  
  // Real-time Badge Counters for the Nav Bar Links
  const [ownerBadgeCount, setOwnerBadgeCount] = useState(0);
  const [userBadgeCount, setUserBadgeCount] = useState(0);

  // Keep a live mutable reference to the active path to bypass React closure traps
  const currentPathRef = useRef(location.pathname);
  useEffect(() => {
    currentPathRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    // If the user logs out or session is empty, disconnect cleanly
    if (!userData?._id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // 🌐 DYNAMIC FIX: Checks if you're local or in production
    const SOCKET_URL = window.location.hostname === "localhost" 
      ? "http://localhost:8000" 
      : "https://vingo-food-delivery-backend-tbhw.onrender.com";

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Join respective channels instantly on login/mount
    newSocket.emit('joinRoom', userData._id.toString());     // Kitchen room channel
    newSocket.emit('joinUserRoom', userData._id.toString()); // Customer tracking channel

    // 1. Listen for new incoming orders (Owner Badge increment logic)
    newSocket.on('newOrderReceived', (incomingOrder) => {
      console.log("Global Socket Catch: New order received, active location path is:", currentPathRef.current);
      if (currentPathRef.current !== '/dashboard/orders') {
        setOwnerBadgeCount((prev) => prev + 1);
      }
    });

    // 2. Listen for delivery milestones (Customer Tracking Badge increment logic)
    newSocket.on('orderStatusUpdated', (data) => {
      console.log("Global Socket Catch: Order status update, active location path is:", currentPathRef.current);
      if (currentPathRef.current !== '/my-orders') {
        setUserBadgeCount((prev) => prev + 1);
      }
    });

    return () => {
      newSocket.off('newOrderReceived');
      newSocket.off('orderStatusUpdated');
      newSocket.disconnect();
    };
  }, [userData?._id]);

  // Clean out notification numbers immediately when visiting respective screens
  useEffect(() => {
    if (location.pathname === '/dashboard/orders') setOwnerBadgeCount(0);
    if (location.pathname === '/my-orders') setUserBadgeCount(0);
  }, [location.pathname]);

  return (
    <SocketContext.Provider value={{ socket, ownerBadgeCount, userBadgeCount }}>
      {children}
    </SocketContext.Provider>
  );
};
