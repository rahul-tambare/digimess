import client from './client';

export const getConfig    = () => client.get('/admin/config');
export const updateConfig = (data) => client.post('/admin/config', data);
