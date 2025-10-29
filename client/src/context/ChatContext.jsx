import React, { createContext, useState, useContext, useEffect } from 'react';
import { channelService, messageService, userService } from '../services';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [channels, setChannels] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { isAuthenticated, authChecked } = useAuth();
  const { socket, isConnected } = useSocket();

  // Load initial data only when authenticated
  useEffect(() => {
    if (authChecked && isAuthenticated) {
      loadInitialData();
    } else if (authChecked && !isAuthenticated) {
      // Clear data if not authenticated
      setChannels([]);
      setUsers([]);
      setCurrentChannel(null);
      setMessages([]);
    }
  }, [isAuthenticated, authChecked]);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      console.log('📨 New message received:', message);
      setMessages(prev => {
        // Avoid duplicates
        if (prev.some(m => m._id === message._id)) return prev;
        return [...prev, message];
      });
    };

    const handleMessageUpdated = (updatedMessage) => {
      console.log('✏️ Message updated:', updatedMessage);
      setMessages(prev => prev.map(msg => 
        msg._id === updatedMessage._id ? updatedMessage : msg
      ));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_updated', handleMessageUpdated);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_updated', handleMessageUpdated);
    };
  }, [socket, currentChannel]);

  const loadInitialData = async () => {
    if (!isAuthenticated) {
      console.log('🚫 Not authenticated, skipping data load');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading initial chat data...');
      
      // Load channels and users in parallel
      const [channelsResponse, usersResponse] = await Promise.all([
        channelService.getChannels(),
        userService.getUsers()
      ]);
      
      const loadedChannels = channelsResponse.data?.channels || [];
      const loadedUsers = usersResponse.data?.users || [];
      
      setChannels(loadedChannels);
      setUsers(loadedUsers);
      
      console.log(`✅ Loaded ${loadedChannels.length} channels and ${loadedUsers.length} users`);
      
      // Try to restore the last selected channel from localStorage
      const lastChannelId = localStorage.getItem('lastChannelId');
      if (lastChannelId) {
        const lastChannel = loadedChannels.find(ch => ch._id === lastChannelId);
        if (lastChannel) {
          console.log(`🔄 Restoring last channel: ${lastChannel.name} (${lastChannel._id})`);
          setCurrentChannel(lastChannel);
          await loadMessages(lastChannel._id);
          return;
        }
      }
      
      // Auto-select first channel if none selected and no last channel found
      if (loadedChannels.length > 0 && !currentChannel) {
        const firstChannel = loadedChannels[0];
        console.log(`🔄 Auto-selecting channel: ${firstChannel.name} (${firstChannel._id})`);
        setCurrentChannel(firstChannel);
        await loadMessages(firstChannel._id);
      }
    } catch (error) {
      console.error('❌ Error loading initial data:', error);
      setError('Failed to load chat data. Please refresh the page.');
      setChannels([]);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (channelId) => {
    if (!channelId || !isAuthenticated) {
      console.log('🚫 Cannot load messages: no channel ID or not authenticated');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      console.log(`📨 Loading messages for channel: ${channelId}`);
      
      const response = await messageService.getMessages(channelId);
      const loadedMessages = response.data?.messages || [];
      
      console.log(`✅ Loaded ${loadedMessages.length} messages for channel: ${channelId}`);
      setMessages(loadedMessages);
    } catch (error) {
      console.error(`❌ Error loading messages for channel ${channelId}:`, error);
      
      if (error.response?.status === 403) {
        setError('You do not have access to this channel.');
      } else {
        setError('Failed to load messages. Please try again.');
      }
      
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const selectChannel = async (channel) => {
    if (!isAuthenticated || !channel) return;
    
    console.log(`🎯 Selecting channel: ${channel.name} (${channel._id})`);
    setCurrentChannel(channel);
    
    // Save to localStorage for persistence
    localStorage.setItem('lastChannelId', channel._id);
    
    await loadMessages(channel._id);
    
    // Join the channel room for real-time updates
    if (socket) {
      socket.emit('join_channel', { channelId: channel._id });
    }
  };

  const sendMessage = async (channelId, content) => {
    if (!content.trim() || !isAuthenticated) return;

    try {
      console.log(`💬 Sending message to channel ${channelId}:`, content);
      
      // Create optimistic message
      const tempMessage = {
        _id: `temp-${Date.now()}`,
        content,
        sender: {
          _id: 'temp',
          username: 'You',
          avatar: null,
          status: 'online'
        },
        channel: channelId,
        createdAt: new Date().toISOString(),
        isSending: true
      };

      // Add optimistic message immediately
      setMessages(prev => [...prev, tempMessage]);

      const response = await messageService.sendMessage(channelId, { content });
      const newMessage = response.data?.message;
      
      if (newMessage) {
        console.log('✅ Message sent successfully:', newMessage._id);
        
        // Replace optimistic message with real message
        setMessages(prev => prev.map(msg => 
          msg._id === tempMessage._id ? newMessage : msg
        ));
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
      
      setError('Failed to send message');
      throw error;
    }
  };

  const createChannel = async (channelData) => {
    if (!isAuthenticated) return;
    
    try {
      const response = await channelService.createChannel(channelData);
      const newChannel = response.data?.channel;
      if (newChannel) {
        setChannels(prev => [...prev, newChannel]);
        return newChannel;
      }
    } catch (error) {
      console.error('Error creating channel:', error);
      setError('Failed to create channel');
      throw error;
    }
  };

  const retryLoad = () => {
    if (isAuthenticated) {
      loadInitialData();
    }
  };

  const value = {
    channels,
    users,
    currentChannel,
    messages,
    loading,
    error,
    selectChannel,
    sendMessage,
    createChannel,
    loadMessages,
    retryLoad,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};