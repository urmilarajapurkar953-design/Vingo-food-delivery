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
  
  const [ownerBadgeCount, setOwnerBadgeCount] = useState(0);
  const [userBadgeCount, setUserBadgeCount] = useState(0);

  const currentPathRef = useRef(location.pathname);
  useEffect(() => {
    currentPathRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (!userData?._id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const SOCKET_URL = window.location.hostname === "localhost" 
      ? "http://localhost:8000" 
      : "https://vingo-food-delivery-backend-tbhw.onrender.com";

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.emit('joinRoom', userData._id.toString());    
    newSocket.emit('joinUserRoom', userData._id.toString()); 
    newSocket.on('newOrderReceived', (incomingOrder) => {
      console.log("Global Socket Catch: New order received, active location path is:", currentPathRef.current);
      if (currentPathRef.current !== '/dashboard/orders') {
        setOwnerBadgeCount((prev) => prev + 1);
      }
    });

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
