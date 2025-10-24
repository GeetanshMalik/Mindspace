import api from './api';

export const journalService = {
  getEntries: async () => {
    const response = await api.get('/journal');
    return response.data;
  },
  
  createEntry: async (entry) => {
    const response = await api.post('/journal', entry);
    return response.data;
  }
};
