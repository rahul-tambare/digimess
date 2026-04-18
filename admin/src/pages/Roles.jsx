import { useState, useEffect } from 'react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { Plus, Edit, Trash2, Shield, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import * as rbacApi from '../api/rbac';
import { useAuth } from '../context/AuthContext';

export default function RolesPage() {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Role form
  const [roleModal, setRoleModal] = useState({ open: false, mode: 'create' });
  const [roleForm, setRoleForm] = useState({ name: '', description: '' });

  // Permission assignment
  const [permModal, setPermModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [allPermissions, setAllPermissions] = useState({});
  const [assignedPermIds, setAssignedPermIds] = useState([]);

  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await rbacApi.getRoles();
      setRoles(res.data.data);
    } catch {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await rbacApi.getPermissions();
      setAllPermissions(res.data.grouped);
    } catch {
      toast.error('Failed to load permissions');
    }
  };

  useEffect(() => { fetchRoles(); fetchPermissions(); }, []);

  const openCreate = () => {
    setRoleForm({ name: '', description: '' });
    setRoleModal({ open: true, mode: 'create' });
  };

  const openEdit = (role) => {
    setRoleForm({ id: role.id, name: role.name, description: role.description || '' });
    setRoleModal({ open: true, mode: 'edit' });
  };

  const openPermissions = async (role) => {
    try {
      const res = await rbacApi.getRoleById(role.id);
      setSelectedRole(role);
      setAssignedPermIds(res.data.permissions.map(p => p.id));
      setPermModal(true);
    } catch {
      toast.error('Failed to load role permissions');
    }
  };

  const handleRoleSubmit = async () => {
    if (!roleForm.name.trim()) {
      toast.error('Role name is required');
      return;
    }
    try {
      if (roleModal.mode === 'create') {
        await rbacApi.createRole(roleForm);
        toast.success('Role created');
      } else {
        await rbacApi.updateRole(roleForm.id, roleForm);
        toast.success('Role updated');
      }
      setRoleModal({ open: false, mode: 'create' });
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    try {
      await rbacApi.deleteRole(confirmDelete.id);
      toast.success('Role deleted');
      setConfirmDelete(null);
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const togglePermission = (permId) => {
    setAssignedPermIds(prev =>
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
  };

  const toggleModule = (module) => {
    const modulePermIds = allPermissions[module].map(p => p.id);
    const allSelected = modulePermIds.every(id => assignedPermIds.includes(id));
    if (allSelected) {
      setAssignedPermIds(prev => prev.filter(id => !modulePermIds.includes(id)));
    } else {
      setAssignedPermIds(prev => [...new Set([...prev, ...modulePermIds])]);
    }
  };

  const handleSavePermissions = async () => {
    try {
      await rbacApi.assignPermissions(selectedRole.id, assignedPermIds);
      toast.success('Permissions updated');
      setPermModal(false);
      fetchRoles();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update permissions');
    }
  };

  const columns = [
    {
      key: 'name', label: 'Role',
      render: (v, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          {row.isSuperAdmin
            ? <ShieldCheck size={18} style={{ color: 'var(--warning)' }} />
            : <Shield size={18} style={{ color: 'var(--text-muted)' }} />
          }
          <span style={{ fontWeight: 600 }}>{v}</span>
          {row.isSuperAdmin && <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>SUPER</span>}
        </div>
      ),
    },
    { key: 'description', label: 'Description', render: v => v || <span className="text-muted">—</span> },
    {
      key: 'permissionCount', label: 'Permissions',
      render: (v, row) => (
        <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
          {row.isSuperAdmin ? 'All' : v}
        </span>
      ),
    },
    {
      key: 'userCount', label: 'Users',
      render: v => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    {
      key: 'isActive', label: 'Status',
      render: v => <StatusBadge status={v ? 'active' : 'inactive'} />,
    },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="table-actions">
          {hasPermission('roles:update') && !row.isSuperAdmin && (
            <>
              <button className="btn btn-sm" onClick={() => openEdit(row)}><Edit size={13} /> Edit</button>
              <button className="btn btn-sm" onClick={() => openPermissions(row)}><Shield size={13} /> Perms</button>
            </>
          )}
          {hasPermission('roles:delete') && !row.isSuperAdmin && row.userCount === 0 && (
            <button className="btn btn-sm btn-danger" onClick={() => setConfirmDelete(row)}><Trash2 size={13} /></button>
          )}
        </div>
      ),
    },
  ];

  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Roles & Permissions</h1>
          <p className="page-subtitle">{roles.length} role{roles.length !== 1 ? 's' : ''} configured</p>
        </div>
        {hasPermission('roles:create') && (
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> New Role</button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={roles}
        loading={loading}
        emptyMessage="No roles found"
      />

      {/* Create / Edit Role Modal */}
      <Modal
        open={roleModal.open}
        onClose={() => setRoleModal({ open: false, mode: 'create' })}
        title={roleModal.mode === 'create' ? 'Create Role' : 'Edit Role'}
        footer={
          <>
            <button className="btn" onClick={() => setRoleModal({ open: false, mode: 'create' })}>Cancel</button>
            <button className="btn btn-primary" onClick={handleRoleSubmit}>
              {roleModal.mode === 'create' ? 'Create' : 'Update'}
            </button>
          </>
        }
      >
        <div className="form">
          <div className="form-group">
            <label>Role Name</label>
            <input value={roleForm.name} onChange={e => setRoleForm({ ...roleForm, name: e.target.value })} placeholder="e.g. Editor, Viewer" />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={roleForm.description}
              onChange={e => setRoleForm({ ...roleForm, description: e.target.value })}
              placeholder="What can this role do?"
              rows={3}
              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', fontSize: '0.875rem', resize: 'vertical' }}
            />
          </div>
        </div>
      </Modal>

      {/* Permission Assignment Modal */}
      <Modal
        open={permModal}
        onClose={() => setPermModal(false)}
        title={`Permissions — ${selectedRole?.name}`}
        footer={
          <>
            <button className="btn" onClick={() => setPermModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSavePermissions}>Save Permissions</button>
          </>
        }
      >
        <div style={{ maxHeight: '55vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
          {Object.entries(allPermissions).map(([module, perms]) => {
            const allChecked = perms.every(p => assignedPermIds.includes(p.id));
            const someChecked = perms.some(p => assignedPermIds.includes(p.id));

            return (
              <div key={module} style={{ marginBottom: '1.25rem' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  marginBottom: '0.5rem', paddingBottom: '0.375rem',
                  borderBottom: '1px solid var(--border)'
                }}>
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
                    onChange={() => toggleModule(module)}
                    style={{ width: 16, height: 16, accentColor: 'var(--primary)', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text)' }}>
                    {capitalize(module)}
                  </span>
                </div>
                <div style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {perms.map(perm => (
                    <label key={perm.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)',
                      padding: '0.25rem 0'
                    }}>
                      <input
                        type="checkbox"
                        checked={assignedPermIds.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                        style={{ width: 15, height: 15, accentColor: 'var(--primary)', cursor: 'pointer' }}
                      />
                      <span style={{ fontWeight: 500, minWidth: 60, color: 'var(--text)' }}>{perm.action}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>— {perm.description}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        title={`Delete role "${confirmDelete?.name}"?`}
        message="This role will be permanently removed. Make sure no admin users are assigned to it."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
