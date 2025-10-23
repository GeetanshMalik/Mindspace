import api from './api';

export const threadService = {
  getThreads: async (params = {}) => {
    const response = await api.get('/threads', { params });
    return response.data;
  },

  getThread: async (id) => {
    const response = await api.get(`/threads/${id}`);
    return response.data;
  },

  createThread: async (data) => {
    const response = await api.post('/threads', data);
    return response.data;
  },

  deleteThread: async (id) => {
    const response = await api.delete(`/threads/${id}`);
    return response.data;
  },

  likeThread: async (id) => {
    const response = await api.post(`/threads/${id}/like`);
    return response.data;
  }
};
