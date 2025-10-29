import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  MessageSquare,
  Users,
  Settings,
  Plus,
  ChevronDown,
  ChevronRight,
  Hash,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import UserSearch from "../users/UserSearch";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { channels, users, createChannel, messages } = useChat(); // Added messages
  const { channelId } = useParams();
  const navigate = useNavigate();

  const [channelsOpen, setChannelsOpen] = useState(true);
  const [directMessagesOpen, setDirectMessagesOpen] = useState(true);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");

  const handleCreateChannel = async (e) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;

    try {
      await createChannel({
        name: newChannelName.trim(),
        description: "",
        type: "public",
      });
      setNewChannelName("");
      setShowCreateChannel(false);
    } catch (error) {
      console.error("Error creating channel:", error);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getInitials = (username) => {
    return username ? username.charAt(0).toUpperCase() : "U";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-yellow-500";
      case "busy":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Get ALL conversations the user is part of (not just direct messages)
  const getUserConversations = () => {
    if (!channels || !user) return [];

    return channels.filter((channel) => {
      // Include public channels user has access to
      if (channel.type === "public") return true;

      // Include private channels user is member of
      if (channel.type === "private") {
        return channel.members?.some((member) => member.user?._id === user._id);
      }

      // Include direct messages user is part of
      if (channel.type === "direct") {
        return channel.members?.some((member) => member.user?._id === user._id);
      }

      // Include group DMs
      if (channel.type === "group") {
        return channel.members?.some((member) => member.user?._id === user._id);
      }

      return false;
    });
  };

  // Get conversations with recent activity (prioritize ones with messages)
  const getActiveConversations = () => {
    const conversations = getUserConversations();

    // Sort by most recent activity
    return conversations.sort((a, b) => {
      const aLastActivity = getLastActivity(a._id);
      const bLastActivity = getLastActivity(b._id);
      return new Date(bLastActivity) - new Date(aLastActivity);
    });
  };

  // Get last activity timestamp for a channel
  const getLastActivity = (channelId) => {
    const channelMessages = messages.filter((msg) => msg.channel === channelId);
    if (channelMessages.length > 0) {
      return channelMessages[channelMessages.length - 1].createdAt;
    }
    return new Date(channelId).toISOString(); // Fallback to channel creation
  };

  // Separate conversations by type
  const publicChannels = getActiveConversations().filter(
    (channel) => channel.type === "public"
  );
  const privateChannels = getActiveConversations().filter(
    (channel) => channel.type === "private"
  );
  const directMessages = getActiveConversations().filter(
    (channel) => channel.type === "direct" || channel.type === "group"
  );

  // Get users for new conversations (excluding existing ones)
  const getAvailableUsers = () => {
    if (!users || !user) return [];

    const existingUserIds = new Set();

    // Collect all user IDs from existing conversations
    directMessages.forEach((channel) => {
      channel.members?.forEach((member) => {
        if (member.user?._id && member.user._id !== user._id) {
          existingUserIds.add(member.user._id);
        }
      });
    });

    return users.filter(
      (userItem) =>
        userItem._id !== user._id && !existingUserIds.has(userItem._id)
    );
  };

  const availableUsers = getAvailableUsers();

  return (
    <div className="w-64 bg-primary-800 text-white flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-primary-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold">Ongea</h1>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-primary-700">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white font-medium">
              {getInitials(user?.username)}
            </div>
            <div
              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-primary-800 ${getStatusColor(
                user?.status
              )}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user?.username || "User"}
            </p>
            <p className="text-xs text-primary-300 truncate">
              {user?.email || "user@example.com"}
            </p>
          </div>
        </div>
      </div>

      {/* User Search */}
      <div className="p-4 border-b border-primary-700">
        <UserSearch />
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        {/* Public Channels Section */}
        {publicChannels.length > 0 && (
          <div className="p-4">
            <button
              onClick={() => setChannelsOpen(!channelsOpen)}
              className="flex items-center justify-between w-full text-sm font-medium text-primary-200 hover:text-white mb-2"
            >
              <span>CHANNELS</span>
              {channelsOpen ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {channelsOpen && (
              <div className="space-y-1">
                {publicChannels.map((channel) => (
                  <Link
                    key={channel._id}
                    to={`/channels/${channel._id}`}
                    className={`flex items-center space-x-2 px-2 py-1 rounded text-sm hover:bg-primary-700 transition-colors ${
                      channelId === channel._id
                        ? "bg-primary-700 text-white"
                        : "text-primary-200"
                    }`}
                  >
                    <Hash className="w-4 h-4" />
                    <span className="truncate">{channel.name}</span>
                  </Link>
                ))}

                <button
                  onClick={() => setShowCreateChannel(true)}
                  className="flex items-center space-x-2 px-2 py-1 rounded text-sm text-primary-200 hover:text-white hover:bg-primary-700 transition-colors w-full"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Channel</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Private Channels Section */}
        {privateChannels.length > 0 && (
          <div className="p-4 border-t border-primary-700">
            <div className="flex items-center justify-between w-full text-sm font-medium text-primary-200 mb-2">
              <span>PRIVATE CHANNELS</span>
            </div>
            <div className="space-y-1">
              {privateChannels.map((channel) => (
                <Link
                  key={channel._id}
                  to={`/channels/${channel._id}`}
                  className={`flex items-center space-x-2 px-2 py-1 rounded text-sm hover:bg-primary-700 transition-colors ${
                    channelId === channel._id
                      ? "bg-primary-700 text-white"
                      : "text-primary-200"
                  }`}
                >
                  <Hash className="w-4 h-4" />
                  <span className="truncate">{channel.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Direct Messages Section */}
        <div className="p-4 border-t border-primary-700">
          <button
            onClick={() => setDirectMessagesOpen(!directMessagesOpen)}
            className="flex items-center justify-between w-full text-sm font-medium text-primary-200 hover:text-white mb-2"
          >
            <span>DIRECT MESSAGES</span>
            {directMessagesOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {directMessagesOpen && (
            <div className="space-y-1">
              {/* Existing DM Conversations */}
              {directMessages.length > 0 ? (
                directMessages.map((channel) => {
                  // For direct messages, find the other user(s)
                  if (channel.type === "direct") {
                    const otherMember = channel.members?.find(
                      (member) => member.user?._id !== user?._id
                    );

                    if (!otherMember) return null;

                    return (
                      <Link
                        key={channel._id}
                        to={`/channels/${channel._id}`}
                        className={`flex items-center space-x-2 px-2 py-1 rounded text-sm hover:bg-primary-700 transition-colors ${
                          channelId === channel._id
                            ? "bg-primary-700 text-white"
                            : "text-primary-200"
                        }`}
                      >
                        <div className="relative">
                          <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-xs text-white">
                            {getInitials(otherMember.user?.username)}
                          </div>
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-primary-800 ${getStatusColor(
                              otherMember.user?.status
                            )}`}
                          />
                        </div>
                        <span className="truncate">
                          {otherMember.user?.username}
                        </span>
                      </Link>
                    );
                  }

                  // For group DMs, show group name and participants
                  if (channel.type === "group") {
                    const memberNames = channel.members
                      ?.filter((member) => member.user?._id !== user?._id)
                      .map((member) => member.user?.username)
                      .join(", ");

                    return (
                      <Link
                        key={channel._id}
                        to={`/channels/${channel._id}`}
                        className={`flex items-center space-x-2 px-2 py-1 rounded text-sm hover:bg-primary-700 transition-colors ${
                          channelId === channel._id
                            ? "bg-primary-700 text-white"
                            : "text-primary-200"
                        }`}
                      >
                        <div className="relative">
                          <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white">
                            <Users className="w-3 h-3" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="truncate block">
                            {channel.name || "Group Chat"}
                          </span>
                          <span className="text-xs text-primary-400 truncate block">
                            {memberNames}
                          </span>
                        </div>
                      </Link>
                    );
                  }

                  return null;
                })
              ) : (
                <div className="text-primary-300 text-sm px-2 py-1">
                  No conversations yet
                </div>
              )}

              {/* Available Users to Start New DMs */}
              {availableUsers.length > 0 && (
                <>
                  <div className="pt-2 mt-2 border-t border-primary-600">
                    <p className="text-xs text-primary-300 mb-2">
                      START NEW CONVERSATION
                    </p>
                    {availableUsers.map((userItem) => (
                      <Link
                        key={userItem._id}
                        to={`/dm/${userItem._id}`}
                        className={`flex items-center space-x-2 px-2 py-1 rounded text-sm hover:bg-primary-700 transition-colors text-primary-200`}
                      >
                        <div className="relative">
                          <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center text-xs text-white">
                            {getInitials(userItem.username)}
                          </div>
                          <div
                            className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-primary-800 ${getStatusColor(
                              userItem.status
                            )}`}
                          />
                        </div>
                        <span className="truncate">{userItem.username}</span>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-primary-700 space-y-2">
        <Link
          to="/settings"
          className="flex items-center space-x-2 px-2 py-1 rounded text-sm text-primary-200 hover:text-white hover:bg-primary-700 transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </Link>

        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-2 py-1 rounded text-sm text-primary-200 hover:text-white hover:bg-primary-700 transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create Channel
            </h3>
            <form onSubmit={handleCreateChannel}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Channel Name
                  </label>
                  <input
                    type="text"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="e.g. general"
                    autoFocus
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateChannel(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newChannelName.trim()}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Create
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
