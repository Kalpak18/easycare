import { api } from './api';

export const ProviderService = {
  getDashboard: async () => {
    const res = await api.get('/providers/dashboard');
    return res.data;
  },

  goOnline: async () => {
    await api.patch('/providers/online');
  },

  goOffline: async () => {
    await api.patch('/providers/offline');
  },
};
