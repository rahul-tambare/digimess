import client from './client';

export const getRevenue = (params) => client.get('/admin/revenue', { params });
