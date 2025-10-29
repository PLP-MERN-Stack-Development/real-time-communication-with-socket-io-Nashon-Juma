import api from './api';

export const messageService = {
  getMessages: (channelId, page = 1, limit = 50) => 
    api.get(`/messages/${channelId}?page=${page}&limit=${limit}`),
  sendMessage: (channelId, messageData) => 
    api.post(`/messages/${channelId}`, messageData),
  deleteMessage: (messageId) => 
    api.delete(`/messages/${messageId}`),
  addReaction: (messageId, reactionData) => 
    api.post(`/messages/${messageId}/reactions`, reactionData),
};