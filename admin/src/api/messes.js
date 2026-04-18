import client from './client';

export const getAll = () => client.get('/admin/messes');
export const approve = (id, isApproved) =>
  client.patch(`/admin/messes/${id}/approve`, { isApproved });
export const toggleStatus = (id, isActive) =>
  client.patch(`/admin/messes/${id}/status`, { isActive });
