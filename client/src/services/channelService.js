import api from './api';

export const channelService = {
  getChannels: () => api.get('/channels'),
  getChannel: (id) => api.get(`/channels/${id}`),
  createChannel: (channelData) => api.post('/channels', channelData),
  createDirectMessage: (data) => api.post('/channels/direct', data),
  updateChannel: (id, channelData) => api.put(`/channels/${id}`, channelData),
  joinChannel: (id) => api.post(`/channels/${id}/join`),
  leaveChannel: (id) => api.post(`/channels/${id}/leave`),
};