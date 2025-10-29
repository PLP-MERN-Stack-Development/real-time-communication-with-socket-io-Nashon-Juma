import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const useSocket = () => {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user || !token) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: {
        token,
      },
      autoConnect: true,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('🔗 Connected to server');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('🔌 Disconnected from server');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      toast.error('Failed to connect to server');
    });

    // Message events
    socket.on('new_message', (message) => {
      // This will be handled in the chat context
      window.dispatchEvent(new CustomEvent('new_message', { detail: message }));
    });

    socket.on('message_updated', (message) => {
      window.dispatchEvent(new CustomEvent('message_updated', { detail: message }));
    });

    // Typing indicators
    socket.on('user_typing', (data) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.channelId]: [...(prev[data.channelId] || []).filter(u => u.userId !== data.userId), data],
      }));
    });

    socket.on('user_stopped_typing', (data) => {
      setTypingUsers(prev => ({
        ...prev,
        [data.channelId]: (prev[data.channelId] || []).filter(u => u.userId !== data.userId),
      }));
    });

    // User events
    socket.on('user_status_changed', (data) => {
      window.dispatchEvent(new CustomEvent('user_status_changed', { detail: data }));
    });

    // Error handling
    socket.on('error', (error) => {
      toast.error(error.message || 'An error occurred');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, token]);

  const sendMessage = (channelId, content, replyTo = null, tempId = null) => {
    if (!socketRef.current) return;

    socketRef.current.emit('send_message', {
      channelId,
      content,
      replyTo,
      tempId,
    });
  };

  const startTyping = (channelId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('typing_start', { channelId });
  };

  const stopTyping = (channelId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('typing_stop', { channelId });
  };

  const addReaction = (messageId, emoji) => {
    if (!socketRef.current) return;
    socketRef.current.emit('add_reaction', { messageId, emoji });
  };

  const markMessagesRead = (channelId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('mark_messages_read', { channelId });
  };

  const joinChannel = (channelId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('join_channel', { channelId });
  };

  const leaveChannel = (channelId) => {
    if (!socketRef.current) return;
    socketRef.current.emit('leave_channel', { channelId });
  };

  return {
    socket: socketRef.current,
    isConnected,
    typingUsers,
    sendMessage,
    startTyping,
    stopTyping,
    addReaction,
    markMessagesRead,
    joinChannel,
    leaveChannel,
  };
};