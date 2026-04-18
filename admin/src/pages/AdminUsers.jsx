import { useState, useEffect } from 'react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { UserPlus, Edit, Trash2, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import * as rbacApi from '../api/rbac';
import { useAuth } from '../context/AuthContext';

const emptyForm = { name: '', email: '', password: '', roleId: '', isActive: true };

export default function AdminUsersPage() {
  const { hasPermission, user: currentUser } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');

  const [modal, setModal] = useState({ open: false, mode: 'create' });
  const [form, setForm] = useState(emptyForm);

  const [confirmDelete, setConfirmDelete] = useState(null);
  const [resetModal, setResetModal] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await rbacApi.getAdminUsers({ page, limit: 10, search });
      setAdmins(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await rbacApi.getRoles();
      setRoles(res.data.data);
    } catch {
      toast.error('Failed to load roles');
    }
  };

  useEffect(() => { fetchRoles(); }, []);
  useEffect(() => { fetchAdmins(); }, [page, search]);

  const openCreate = () => {
    setForm(emptyForm);
    setModal({ open: true, mode: 'create' });
  };

  const openEdit = (admin) => {
    setForm({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      password: '',
      roleId: admin.roleId,
      isActive: !!admin.isActive,
    });
    setModal({ open: true, mode: 'edit' });
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.roleId) {
      toast.error('Name, email, and role are required');
      return;
    }
    try {
      if (modal.mode === 'create') {
        if (!form.password || form.password.length < 6) {
          toast.error('Password must be at least 6 characters');
          return;
        }
        await rbacApi.createAdminUser(form);
        toast.success('Admin user created');
      } else {
        const { password, ...updateData } = form;
        await rbacApi.updateAdminUser(form.id, updateData);
        toast.success('Admin user updated');
      }
      setModal({ open: false, mode: 'create' });
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    try {
      await rbacApi.deleteAdminUser(confirmDelete.id);
      toast.success('Admin user deleted');
      setConfirmDelete(null);
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    try {
      await rbacApi.resetAdminPassword(resetModal.id, newPassword);
      toast.success('Password reset successfully');
      setResetModal(null);
      setNewPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Reset failed');
    }
  };

  const columns = [
    {
      key: 'name', label: 'Admin',
      render: (v, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="avatar" style={{ background: `hsl(${(v || '').length * 50}, 60%, 45%)` }}>
            {(v || '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="user-cell-info">
            <span className="user-cell-name">{v}</span>
            <span className="user-cell-phone">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'roleName', label: 'Role',
      render: (v, row) => (
        <StatusBadge status={row.isSuperAdmin ? 'Super Admin' : v} />
      ),
    },
    {
      key: 'isActive', label: 'Status',
      render: v => <StatusBadge status={v ? 'active' : 'inactive'} />,
    },
    {
      key: 'lastLoginAt', label: 'Last Login',
      render: v => v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : <span className="text-muted">Never</span>,
    },
    {
      key: 'createdAt', label: 'Created',
      render: v => v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="table-actions">
          {hasPermission('admins:update') && (
            <>
              <button className="btn btn-sm" onClick={() => openEdit(row)}><Edit size={13} /> Edit</button>
              <button className="btn btn-sm" onClick={() => { setResetModal(row); setNewPassword(''); }}><KeyRound size={13} /></button>
            </>
          )}
          {hasPermission('admins:delete') && row.id !== currentUser?.id && (
            <button className="btn btn-sm btn-danger" onClick={() => setConfirmDelete(row)}><Trash2 size={13} /></button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Admin Users</h1>
          <p className="page-subtitle">{pagination.total} admin user{pagination.total !== 1 ? 's' : ''}</p>
        </div>
        {hasPermission('admins:create') && (
          <button className="btn btn-primary" onClick={openCreate}><UserPlus size={16} /> Add Admin</button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={admins}
        loading={loading}
        emptyMessage="No admin users found"
        serverSide
        total={pagination.total}
        page={page}
        onPageChange={setPage}
        toolbar={
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="table-search-input"
            style={{ minWidth: 220 }}
          />
        }
      />

      {/* Create / Edit Modal */}
      <Modal
        open={modal.open}
        onClose={() => setModal({ open: false, mode: 'create' })}
        title={modal.mode === 'create' ? 'Add Admin User' : 'Edit Admin User'}
        footer={
          <>
            <button className="btn" onClick={() => setModal({ open: false, mode: 'create' })}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {modal.mode === 'create' ? 'Create' : 'Update'}
            </button>
          </>
        }
      >
        <div className="form">
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="admin@digimess.com" />
            </div>
          </div>
          <div className="form-row">
            {modal.mode === 'create' && (
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" />
              </div>
            )}
            <div className="form-group">
              <label>Role</label>
              <select value={form.roleId} onChange={e => setForm({ ...form, roleId: e.target.value })}>
                <option value="">Select a role</option>
                {roles.map(r => (
                  <option key={r.id} value={r.id}>{r.name}{r.isSuperAdmin ? ' ★' : ''}</option>
                ))}
              </select>
            </div>
          </div>
          {modal.mode === 'edit' && (
            <div className="form-group">
              <label>Status</label>
              <select value={form.isActive ? '1' : '0'} onChange={e => setForm({ ...form, isActive: e.target.value === '1' })}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
          )}
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        open={!!resetModal}
        onClose={() => setResetModal(null)}
        title={`Reset Password — ${resetModal?.name}`}
        footer={
          <>
            <button className="btn" onClick={() => setResetModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleResetPassword}>Reset Password</button>
          </>
        }
      >
        <div className="form">
          <div className="form-group">
            <label>New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        title={`Delete "${confirmDelete?.name}"?`}
        message="This will permanently remove this admin user. This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
