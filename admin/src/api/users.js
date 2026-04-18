import client from './client';

export const getAll = () => client.get('/admin/users');
export const updateWallet = (userId, amount, type, description) =>
  client.post('/admin/users/wallet', { userId, amount, type, description });
