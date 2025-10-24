import api from './api';

// Set token in headers before each request
const setAuthToken = () => {
  const token = localStorage.getItem('token');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

export const threadService = {
  getThreads: async () => {
    const response = await api.get('/threads');
    return response.data;
  },
  
  createThread: async (threadData) => {
    setAuthToken(); // Add token to headers
    const response = await api.post('/threads', threadData);
    return response.data;
  },
  
  getThread: async (id) => {
    const response = await api.get(`/threads/${id}`);
    return response.data;
  }
};
