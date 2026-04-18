import client from './client';

export const getAll = (params) => client.get('/admin/subscriptions', { params });
