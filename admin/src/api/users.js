import client from './client';

export const getAll = (params) => client.get('/admin/users', { params });
export const updateWallet = (userId, amount, type, description) =>
  client.post('/admin/users/wallet', { userId, amount, type, description });
