import api from './api';

export const threadService = {
  getThreads: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await api.get(`/threads?${query}`);
    return response.data;
  },
  
  getThread: async (id) => {
    const response = await api.get(`/threads/${id}`);
    return response.data;
  },
  
  createThread: async (threadData) => {
    const response = await api.post('/threads', threadData);
    return response.data;
  },
  
  likeThread: async (id) => {
    const response = await api.post(`/threads/${id}/like`);
    return response.data;
  },
  
  deleteThread: async (id) => {
    const response = await api.delete(`/threads/${id}`);
    return response.data;
  }
};
