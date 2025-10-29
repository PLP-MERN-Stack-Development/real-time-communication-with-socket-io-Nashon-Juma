import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState({}); // Initialize as empty object

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
    console.log('🔌 Connecting to socket server...');
    
    const newSocket = io(socketUrl, {
      auth: {
        token,
      },
      autoConnect: true,
    });

    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('✅ Connected to server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('🔌 Disconnected from server');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      toast.error('Failed to connect to server');
    });

    // Typing indicators
    newSocket.on('user_typing', (data) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.channelId]: [...(prev[data.channelId] || []).filter(u => u.userId !== data.userId), data],
      }));
    });

    newSocket.on('user_stopped_typing', (data) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.channelId]: (prev[data.channelId] || []).filter(u => u.userId !== data.userId),
      }));
    });

    // Error handling
    newSocket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      toast.error(error.message || 'An error occurred');
    });

    return () => {
      console.log('🧹 Cleaning up socket connection');
      newSocket.disconnect();
      setTypingUsers({}); // Reset typing users on cleanup
    };
  }, [isAuthenticated, token]);

  const startTyping = (channelId) => {
    if (!socket || !isConnected) return;
    socket.emit('typing_start', { channelId });
  };

  const stopTyping = (channelId) => {
    if (!socket || !isConnected) return;
    socket.emit('typing_stop', { channelId });
  };

  const joinChannel = (channelId) => {
    if (!socket || !isConnected) return;
    socket.emit('join_channel', { channelId });
  };

  const leaveChannel = (channelId) => {
    if (!socket || !isConnected) return;
    socket.emit('leave_channel', { channelId });
  };

  const value = {
    socket,
    isConnected,
    typingUsers, // Make sure this is included
    startTyping,
    stopTyping,
    joinChannel,
    leaveChannel,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};