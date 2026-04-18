import client from './client';

export const getAll = (params) => client.get('/admin/messes', { params });
export const approve = (id, isApproved) =>
  client.patch(`/admin/messes/${id}/approve`, { isApproved });
export const toggleStatus = (id, isActive) =>
  client.patch(`/admin/messes/${id}/status`, { isActive });
