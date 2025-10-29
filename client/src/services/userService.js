import api from './api';

export const userService = {
  getUsers: () => api.get('/users'),
  searchUsers: (query) => api.get(`/users/search?query=${encodeURIComponent(query)}`),
  getUser: (id) => api.get(`/users/${id}`),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
};