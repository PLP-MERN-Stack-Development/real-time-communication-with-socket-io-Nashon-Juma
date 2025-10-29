import React, { useState } from 'react';
import { format } from 'date-fns';
import { Heart, SmilePlus, Reply, MoreHorizontal } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Message = ({ message }) => {
  const { user } = useAuth();
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isOwnMessage = message.sender?._id === user?._id || message.sender?._id === 'temp';
  const isSystemMessage = message.system;
  const isSending = message.isSending;

  const getMessageTime = (timestamp) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
          {message.content}
        </div>
      </div>
    );
  }

  if (isSending) {
    return (
      <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
          isOwnMessage 
            ? 'bg-primary-600 text-white rounded-br-none opacity-70' 
            : 'bg-gray-100 text-gray-900 rounded-bl-none opacity-70'
        }`}>
          <div className="flex items-center space-x-2 mb-1">
            {!isOwnMessage && (
              <span className="text-sm font-medium">{message.sender?.username}</span>
            )}
          </div>
          <p className="text-sm">{message.content}</p>
          <div className="flex justify-end mt-1">
            <div className="text-xs opacity-70">Sending...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4 group relative`}
      onMouseEnter={() => setShowMenu(true)}
      onMouseLeave={() => {
        setShowMenu(false);
        setShowReactions(false);
      }}
    >
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isOwnMessage 
          ? 'bg-primary-600 text-white rounded-br-none' 
          : 'bg-gray-100 text-gray-900 rounded-bl-none'
      }`}>
        {/* Message header */}
        <div className="flex items-center space-x-2 mb-1">
          {!isOwnMessage && (
            <span className="text-sm font-medium">{message.sender?.username}</span>
          )}
          <span className="text-xs opacity-70">
            {getMessageTime(message.createdAt)}
          </span>
        </div>

        {/* Message content */}
        <p className="text-sm">{message.content}</p>

        {/* Message reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {message.reactions.map((reaction, index) => (
              <div
                key={index}
                className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs flex items-center space-x-1"
              >
                <span>{reaction.emoji}</span>
                <span>{reaction.count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;