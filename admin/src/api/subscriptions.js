import client from './client';

export const getAll = () => client.get('/admin/subscriptions');
