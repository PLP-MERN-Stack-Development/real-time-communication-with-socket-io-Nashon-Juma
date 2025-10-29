import React, { useEffect, useRef } from 'react';
import Message from './Message';
import TypingIndicator from './TypingIndicator';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../hooks/useSocket';

const MessageList = () => {
  const { 
    currentChannel, 
    messages, 
    loading, 
    loadMoreMessages,
    hasMoreMessages 
  } = useChat();
  
  const { typingUsers } = useSocket();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleScroll = (e) => {
    const { scrollTop } = e.target;
    if (scrollTop === 0 && hasMoreMessages && !loading) {
      loadMoreMessages();
    }
  };

  if (!currentChannel) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-primary-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Welcome to Ongea!
          </h3>
          <p className="text-gray-500">
            Select a channel or start a conversation
          </p>
        </div>
      </div>
    );
  }

  if (loading && messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const currentTypingUsers = typingUsers[currentChannel?._id] || [];

  return (
    <div 
      ref={messagesContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto bg-white"
    >
      <div className="max-w-4xl mx-auto p-4">
        {hasMoreMessages && (
          <div className="text-center py-4">
            <button
              onClick={loadMoreMessages}
              disabled={loading}
              className="px-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load more messages'}
            </button>
          </div>
        )}

        <div className="space-y-4">
          {messages.map(message => (
            <Message key={message._id} message={message} />
          ))}
        </div>

        {currentTypingUsers.length > 0 && (
          <TypingIndicator users={currentTypingUsers} />
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default MessageList;