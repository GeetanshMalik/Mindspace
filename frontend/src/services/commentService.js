import api from '../config/api';

export const commentService = {
  getComments: async (threadId) => {
    const response = await api.get(`/comments/thread/${threadId}`);
    return response.data;
  },
  
  createComment: async (threadId, content) => {
    const response = await api.post('/comments', { 
      thread: threadId, 
      content 
    });
    return response.data;
  },
  
  likeComment: async (id) => {
    const response = await api.post(`/comments/${id}/like`);
    return response.data;
  },
  
  deleteComment: async (id) => {
    const response = await api.delete(`/comments/${id}`);
    return response.data;
  }
};
