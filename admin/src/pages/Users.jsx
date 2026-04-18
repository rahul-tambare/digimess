import { useState, useEffect } from 'react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { UserPlus, Eye, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';
import * as usersApi from '../api/users';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [walletModal, setWalletModal] = useState(null);
  const [walletForm, setWalletForm] = useState({ amount: '', type: 'credit', description: '' });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersApi.getAll({ page, limit: 10 });
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const filtered = roleFilter === 'all' ? users : users.filter(u => u.role === roleFilter);

  const handleWalletSubmit = async () => {
    if (!walletForm.amount || parseFloat(walletForm.amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    try {
      await usersApi.updateWallet(
        walletModal.id,
        parseFloat(walletForm.amount),
        walletForm.type,
        walletForm.description || `Admin ${walletForm.type}`
      );
      toast.success(`₹${walletForm.amount} ${walletForm.type}ed successfully`);
      setWalletModal(null);
      setWalletForm({ amount: '', type: 'credit', description: '' });
      fetchUsers(); // Refresh
    } catch (err) {
      toast.error(err.response?.data?.error || 'Wallet update failed');
    }
  };

  const columns = [
    {
      key: 'name', label: 'User',
      render: (v, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="avatar" style={{ background: `hsl(${(row.name || '').length * 50}, 60%, 45%)` }}>
            {(row.name || '??').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div className="user-cell-info">
            <span className="user-cell-name">{v || 'Unnamed'}</span>
            <span className="user-cell-phone">{row.phone}</span>
          </div>
        </div>
      ),
    },
    { key: 'email', label: 'Email', render: v => v || <span className="text-muted">—</span> },
    { key: 'role', label: 'Role', render: v => <StatusBadge status={v} /> },
    {
      key: 'walletBalance', label: 'Wallet',
      render: v => <span style={{ fontWeight: 600, color: 'var(--success)' }}>₹{parseFloat(v || 0).toFixed(2)}</span>,
    },
    { key: 'isVerified', label: 'Status', render: v => <StatusBadge status={v ? 'active' : 'inactive'} /> },
    {
      key: 'createdAt', label: 'Joined',
      render: v => v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
    },
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <div className="table-actions">
          <button className="btn btn-sm" onClick={() => setSelectedUser(row)}><Eye size={13} /> View</button>
          <button className="btn btn-sm" onClick={() => { setWalletModal(row); setWalletForm({ amount: '', type: 'credit', description: '' }); }}><Wallet size={13} /></button>
        </div>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p className="page-subtitle">{pagination.total} total users</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        emptyMessage="No users found"
        serverSide
        total={pagination.total}
        page={page}
        onPageChange={setPage}
        toolbar={
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="table-filter-select">
            <option value="all">All Roles</option>
            <option value="customer">Customer</option>
            <option value="vendor">Vendor</option>
            <option value="admin">Admin</option>
          </select>
        }
      />

      {/* User Detail Modal */}
      <Modal open={!!selectedUser} onClose={() => setSelectedUser(null)} title="User Details">
        {selectedUser && (
          <div className="form">
            <div className="form-row">
              <div className="form-group"><label>Name</label><input value={selectedUser.name || '—'} readOnly /></div>
              <div className="form-group"><label>Phone</label><input value={selectedUser.phone} readOnly /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Email</label><input value={selectedUser.email || '—'} readOnly /></div>
              <div className="form-group"><label>Role</label><input value={selectedUser.role} readOnly /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Wallet Balance</label><input value={`₹${parseFloat(selectedUser.walletBalance || 0).toFixed(2)}`} readOnly /></div>
              <div className="form-group"><label>Joined</label><input value={selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : '—'} readOnly /></div>
            </div>
          </div>
        )}
      </Modal>

      {/* Wallet Adjustment Modal */}
      <Modal
        open={!!walletModal}
        onClose={() => setWalletModal(null)}
        title={`Adjust Wallet — ${walletModal?.name || walletModal?.phone}`}
        footer={<><button className="btn" onClick={() => setWalletModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleWalletSubmit}>Submit</button></>}
      >
        <div className="form">
          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select value={walletForm.type} onChange={e => setWalletForm({ ...walletForm, type: e.target.value })}>
                <option value="credit">Credit (+)</option>
                <option value="debit">Debit (−)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Amount (₹)</label>
              <input type="number" value={walletForm.amount} onChange={e => setWalletForm({ ...walletForm, amount: e.target.value })} placeholder="0.00" />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <input value={walletForm.description} onChange={e => setWalletForm({ ...walletForm, description: e.target.value })} placeholder="e.g. Refund for order #123" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
