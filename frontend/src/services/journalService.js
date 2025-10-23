import api from './api';

export const journalService = {
  getEntries: async () => {
    const response = await api.get('/journal');
    return response.data;
  },

  createEntry: async (data) => {
    const response = await api.post('/journal', data);
    return response.data;
  },

  getMoodTrends: async (days = 7) => {
    const response = await api.get('/journal/stats/trends', { params: { days } });
    return response.data;
  }
};
