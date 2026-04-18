import client from './client';

// ─── Roles ──────────────────────────────────────────────
export const getRoles = () => client.get('/admin/rbac/roles');
export const getRoleById = (id) => client.get(`/admin/rbac/roles/${id}`);
export const createRole = (data) => client.post('/admin/rbac/roles', data);
export const updateRole = (id, data) => client.put(`/admin/rbac/roles/${id}`, data);
export const deleteRole = (id) => client.delete(`/admin/rbac/roles/${id}`);

// ─── Permissions ────────────────────────────────────────
export const getPermissions = () => client.get('/admin/rbac/permissions');
export const assignPermissions = (roleId, permissionIds) =>
  client.put(`/admin/rbac/roles/${roleId}/permissions`, { permissionIds });

// ─── Admin Users ────────────────────────────────────────
export const getAdminUsers = (params) => client.get('/admin/rbac/admins', { params });
export const getAdminUserById = (id) => client.get(`/admin/rbac/admins/${id}`);
export const createAdminUser = (data) => client.post('/admin/rbac/admins', data);
export const updateAdminUser = (id, data) => client.put(`/admin/rbac/admins/${id}`, data);
export const deleteAdminUser = (id) => client.delete(`/admin/rbac/admins/${id}`);
export const resetAdminPassword = (id, password) =>
  client.post(`/admin/rbac/admins/${id}/reset-password`, { password });
