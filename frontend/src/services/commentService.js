import api from './api';

export const commentService = {
  getComments: async (threadId) => {
    const response = await api.get(`/comments/${threadId}`);
    return response.data;
  },

  createComment: async (threadId, content) => {
    const response = await api.post(`/comments/${threadId}`, { content });
    return response.data;
  },

  deleteComment: async (id) => {
    const response = await api.delete(`/comments/${id}`);
    return response.data;
  }
};
