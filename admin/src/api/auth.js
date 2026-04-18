import client from './client';

export const adminLogin = (email, password) =>
  client.post('/auth/admin-login', { email, password });
