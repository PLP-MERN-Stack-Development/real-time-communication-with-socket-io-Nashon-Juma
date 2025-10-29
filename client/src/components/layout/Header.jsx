import React from 'react';
import { useParams } from 'react-router-dom';
import { Users, Bell, Search } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { channelId } = useParams();
  const { currentChannel, users } = useChat();
  const { user } = useAuth();

  const getHeaderTitle = () => {
    if (currentChannel) {
      return `# ${currentChannel.name}`;
    }
    return 'Ongea Chat';
  };

  const getHeaderDescription = () => {
    if (currentChannel) {
      const memberCount = currentChannel.members?.length || 0;
      return `${memberCount} member${memberCount !== 1 ? 's' : ''}`;
    }
    return 'Real-time communication';
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {getHeaderTitle()}
            </h1>
            <p className="text-sm text-gray-500 flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {getHeaderDescription()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search messages..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;