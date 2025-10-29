import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  MessageSquare, 
  Users, 
  Search, 
  MoreHorizontal,
  Paperclip,
  Smile,
  Send,
  Clock
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { format } from 'date-fns';

const Chat = () => {
  const { channelId } = useParams();
  const { currentChannel, selectChannel, channels, messages, sendMessage, loading } = useChat();
  const { user } = useAuth();
  const { typingUsers = {}, startTyping, stopTyping } = useSocket(); // Add default value
  
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Select channel when channelId changes
  useEffect(() => {
    if (channelId && channels.length > 0) {
      const channel = channels.find(c => c._id === channelId);
      if (channel) {
        selectChannel(channel);
      }
    }
  }, [channelId, channels, selectChannel]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle typing indicators
  const handleInputChange = (e) => {
    const value = e.target.value;
    setNewMessage(value);

    if (currentChannel) {
      if (!isTyping) {
        setIsTyping(true);
        startTyping(currentChannel._id);
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        stopTyping(currentChannel._id);
      }, 1000);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentChannel) return;

    sendMessage(currentChannel._id, newMessage.trim());
    setNewMessage('');

    // Clean up typing
    if (isTyping) {
      setIsTyping(false);
      stopTyping(currentChannel._id);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const getMessageTime = (timestamp) => {
    try {
      return format(new Date(timestamp), 'HH:mm');
    } catch (error) {
      console.error('Error formatting time:', error);
      return '--:--';
    }
  };

  const getMessageDate = (timestamp) => {
    try {
      return format(new Date(timestamp), 'MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown date';
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    try {
      const date = getMessageDate(message.createdAt);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
      return groups;
    } catch (error) {
      console.error('Error grouping messages:', error);
      return groups;
    }
  }, {});

  // Safely get typing users for current channel
  const currentTypingUsers = (typingUsers && currentChannel) 
    ? typingUsers[currentChannel._id] || [] 
    : [];

  if (!currentChannel) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-8">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-10 h-10 text-primary-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Welcome to Ongea!</h2>
          <p className="text-gray-600 mb-6">
            Select a channel from the sidebar to start chatting with your team.
          </p>
          <div className="bg-white rounded-lg border border-gray-200 p-4 text-left">
            <h3 className="font-semibold text-gray-900 mb-2">Quick Tips:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Create new channels for different topics</li>
              <li>• Send direct messages to team members</li>
              <li>• Use @mentions to get someone's attention</li>
              <li>• React to messages with emojis</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-500 rounded flex items-center justify-center">
                <span className="text-white font-semibold">#</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {currentChannel.name}
                </h1>
                <p className="text-sm text-gray-500 flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {currentChannel.members?.length || 0} members
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search messages..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
              />
            </div>

            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-4xl mx-auto py-6 px-4">
          {loading && messages.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No messages yet
              </h3>
              <p className="text-gray-500">
                Be the first to send a message in #{currentChannel.name}
              </p>
            </div>
          ) : (
            Object.entries(groupedMessages).map(([date, dateMessages]) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex items-center justify-center my-6">
                  <div className="bg-gray-200 px-3 py-1 rounded-full">
                    <span className="text-xs font-medium text-gray-600 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {date}
                    </span>
                  </div>
                </div>

                {/* Messages for this date */}
                <div className="space-y-1">
                  {dateMessages.map((message, index) => {
                    const isOwnMessage = message.sender?._id === user?._id;
                    const showAvatar = index === 0 || 
                      dateMessages[index - 1]?.sender?._id !== message.sender?._id;

                    return (
                      <div
                        key={message._id}
                        className={`flex space-x-3 p-2 hover:bg-gray-100 rounded-lg group ${
                          isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''
                        }`}
                      >
                        {/* Avatar */}
                        {!isOwnMessage && (
                          <div className="flex-shrink-0">
                            {showAvatar ? (
                              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                {message.sender?.username?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            ) : (
                              <div className="w-8 h-8"></div>
                            )}
                          </div>
                        )}

                        {/* Message Content */}
                        <div className={`flex-1 min-w-0 ${isOwnMessage ? 'text-right' : ''}`}>
                          {/* Username and timestamp */}
                          {!isOwnMessage && showAvatar && (
                            <div className="flex items-baseline space-x-2 mb-1">
                              <span className="font-semibold text-gray-900 text-sm">
                                {message.sender?.username || 'Unknown User'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {getMessageTime(message.createdAt)}
                              </span>
                            </div>
                          )}

                          {/* Message bubble */}
                          <div className={`inline-block max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                            isOwnMessage
                              ? 'bg-primary-600 text-white rounded-br-md'
                              : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>

                          {/* Own message timestamp */}
                          {isOwnMessage && (
                            <div className="mt-1">
                              <span className="text-xs text-gray-500">
                                {getMessageTime(message.createdAt)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {/* Typing Indicator */}
          {currentTypingUsers.length > 0 && (
            <div className="flex items-center space-x-3 p-2">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-500 italic">
                {currentTypingUsers.map(u => u.username).join(', ')} {currentTypingUsers.length === 1 ? 'is' : 'are'} typing...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 bg-white p-4">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
          <div className="flex space-x-4">
            <div className="flex space-x-2">
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={`Message #${currentChannel.name}`}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent max-h-32"
                rows={1}
                style={{ minHeight: '44px' }}
              />
            </div>

            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;