import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../context/AuthContext';

const MessageInput = () => {
  const { currentChannel, sendMessage } = useChat();
  const { startTyping, stopTyping } = useSocket();
  const { user } = useAuth();
  
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTyping && currentChannel) {
        stopTyping(currentChannel._id);
      }
    };
  }, [currentChannel]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!message.trim() || !currentChannel) return;

    sendMessage(currentChannel._id, message.trim());
    setMessage('');

    // Clean up typing
    if (isTyping) {
      setIsTyping(false);
      stopTyping(currentChannel._id);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  if (!currentChannel) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 bg-white p-4">
      <form onSubmit={handleSubmit} className="flex space-x-4 items-end">
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
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={`Message #${currentChannel.name}`}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent max-h-32"
            rows={1}
          />
        </div>

        <button
          type="submit"
          disabled={!message.trim()}
          className="p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;