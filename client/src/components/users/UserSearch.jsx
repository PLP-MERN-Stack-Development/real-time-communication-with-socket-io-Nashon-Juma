import React, { useState, useRef, useEffect } from 'react';
import { Search, User, MessageCircle } from 'lucide-react';
import { userService, channelService } from '../../services';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const UserSearch = () => {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  const { selectChannel, channels } = useChat();
  const { user: currentUser } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchUsers = async (searchQuery) => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      console.log('🔍 Searching for users:', searchQuery);
      const response = await userService.searchUsers(searchQuery);
      console.log('📥 Search results:', response.data);
      
      // Make sure we're accessing the data correctly
      const users = response.data?.data?.users || response.data?.users || [];
      console.log('👥 Users found:', users);
      setSearchResults(users);
    } catch (error) {
      console.error('❌ Error searching users:', error);
      toast.error('Failed to search users');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    
    // Clear results if query is too short
    if (value.length < 2) {
      setSearchResults([]);
      return;
    }
    
    // Debounce the search
    const timeoutId = setTimeout(() => {
      searchUsers(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleInputFocus = () => {
    setShowResults(true);
    // If there's already a query, search again
    if (query.length >= 2) {
      searchUsers(query);
    }
  };

  const startDirectMessage = async (targetUser) => {
    try {
      console.log('💬 Starting DM with:', targetUser.username);
      console.log('📤 Sending request with data:', { userId: targetUser._id });
      
      const response = await channelService.createDirectMessage({ userId: targetUser._id });
      console.log('✅ DM channel created:', response.data);
      
      const dmChannel = response.data.data.channel;
      
      // Update channels list and select the DM channel
      selectChannel(dmChannel);
      setQuery('');
      setShowResults(false);
      setSearchResults([]);
      
      toast.success(`Started conversation with ${targetUser.username}`);
    } catch (error) {
      console.error('❌ Error starting direct message:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      const errorMessage = error.response?.data?.message || 'Failed to start conversation';
      toast.error(errorMessage);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getInitials = (username) => {
    return username ? username.charAt(0).toUpperCase() : 'U';
  };

  return (
    <div className="relative mb-4" ref={searchRef}>
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search users to message..."
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-gray-900 placeholder-gray-500"
        />
      </div>

      {/* Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-80 overflow-y-auto z-50">
          {/* Loading State */}
          {isSearching && (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2">Searching users...</p>
            </div>
          )}

          {/* Results State */}
          {!isSearching && searchResults.length > 0 && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50">
                FOUND {searchResults.length} USER{searchResults.length !== 1 ? 'S' : ''}
              </div>
              {searchResults.map((user) => (
                <button
                  key={user._id}
                  className="flex items-center justify-between w-full px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                  onClick={() => startDirectMessage(user)}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
                        {getInitials(user.username)}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`} />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{user.username}</div>
                      <div className="text-sm text-gray-500 truncate">{user.email}</div>
                      <div className="text-xs text-gray-400 capitalize">{user.status}</div>
                    </div>
                  </div>
                  <MessageCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}

          {/* No Results State */}
          {!isSearching && query.length >= 2 && searchResults.length === 0 && (
            <div className="p-6 text-center text-gray-500">
              <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No users found</p>
              <p className="text-sm mt-1">Try searching with a different name or email</p>
            </div>
          )}

          {/* Initial State - No Search Yet */}
          {!isSearching && query.length < 2 && (
            <div className="p-6 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Search for users</p>
              <p className="text-sm mt-1">Type at least 2 characters to search</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserSearch;