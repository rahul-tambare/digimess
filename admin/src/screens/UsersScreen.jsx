import React, { useState, useEffect } from 'react';
import { Mail, Phone, Wallet, Plus, Minus, X } from 'lucide-react';
import api from '../utils/api';

const WalletModal = ({ user, onClose, onUpdate }) => {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('credit');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/admin/users/wallet', {
        userId: user.id,
        amount: parseFloat(amount),
        type,
        description: description || `Admin ${type}`
      });
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Failed to update wallet', err);
      alert('Failed to update wallet balance.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sidebar-overlay open" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card glass" style={{ width: '90%', maxWidth: 400, padding: 32 }}>
        <div className="flex justify-between items-center mb-6">
          <h2 style={{ fontSize: '1.25rem' }}>Update Wallet</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20}/></button>
        </div>
        
        <p className="text-muted mb-6" style={{ fontSize: 14 }}>Updating wallet for <strong>{user.name}</strong></p>

        <form onSubmit={handleSubmit} className="flex-col gap-4">
          <div className="flex gap-2">
            <button 
              type="button" 
              className={`flex-1 btn-secondary ${type === 'credit' ? 'active' : ''}`}
              onClick={() => setType('credit')}
              style={{ background: type === 'credit' ? 'var(--success)' : 'var(--surface-low)', color: type === 'credit' ? 'white' : 'var(--on-surface)' }}
            >
              <Plus size={16} /> Credit
            </button>
            <button 
              type="button" 
              className={`flex-1 btn-secondary ${type === 'debit' ? 'active' : ''}`}
              onClick={() => setType('debit')}
              style={{ background: type === 'debit' ? 'var(--error)' : 'var(--surface-low)', color: type === 'debit' ? 'white' : 'var(--on-surface)' }}
            >
              <Minus size={16} /> Debit
            </button>
          </div>

          <div className="input-group">
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface-variant)' }}>Amount (₹)</label>
            <input 
              type="number" 
              className="input" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              required 
              placeholder="0.00"
            />
          </div>

          <div className="input-group">
            <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface-variant)' }}>Description (Optional)</label>
            <input 
              type="text" 
              className="input" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="e.g., Refund for Order #123"
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={loading || !amount}>
            {loading ? 'Processing...' : 'Update Balance'}
          </button>
        </form>
      </div>
    </div>
  );
};

const UsersScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = () => {
    setLoading(true);
    api.get('/admin/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error('Failed to view users', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading && users.length === 0) return <div style={{padding: 40, textAlign: 'center', color: 'var(--primary)', fontWeight: 700}}>Loading user database...</div>;

  return (
    <div className="flex-col gap-6">
      <div className="flex-col md-flex-row md-items-center justify-between gap-4 mb-2">
        <div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)' }}>User Management</h1>
          <p className="text-muted mt-1" style={{fontSize: 'clamp(14px, 2vw, 18px)'}}>View and manage all registered platform users.</p>
        </div>
      </div>

      <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr style={{ background: 'var(--surface-low)' }}>
                <th style={{ fontWeight: 800, fontSize: 12, color: 'var(--on-surface-variant)', letterSpacing: 1, textTransform: 'uppercase' }}>User</th>
                <th style={{ fontWeight: 800, fontSize: 12, color: 'var(--on-surface-variant)', letterSpacing: 1, textTransform: 'uppercase' }}>Contact</th>
                <th style={{ fontWeight: 800, fontSize: 12, color: 'var(--on-surface-variant)', letterSpacing: 1, textTransform: 'uppercase' }}>Role</th>
                <th style={{ fontWeight: 800, fontSize: 12, color: 'var(--on-surface-variant)', letterSpacing: 1, textTransform: 'uppercase' }}>Wallet</th>
                <th style={{ fontWeight: 800, fontSize: 12, color: 'var(--on-surface-variant)', letterSpacing: 1, textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{user.name || 'Anonymous User'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex-col gap-1">
                      <span className="flex items-center gap-2 text-sm"><Mail size={14} className="text-muted"/> {user.email || 'N/A'}</span>
                      <span className="flex items-center gap-2 text-sm"><Phone size={14} className="text-muted"/> {user.phone}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ padding: '6px 12px', borderRadius: 8, background: user.role === 'admin' ? 'rgba(var(--primary-rgb), 0.1)' : 'var(--surface-low)', color: user.role === 'admin' ? 'var(--primary)' : 'var(--on-surface)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span className="flex items-center gap-2" style={{ fontWeight: 800, fontSize: 15 }}>
                      ₹{parseFloat(user.walletBalance).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-secondary" 
                      style={{ padding: '8px 12px', fontSize: 12 }}
                      onClick={() => setSelectedUser(user)}
                    >
                      <Plus size={14} /> Wallet
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--on-surface-variant)' }}>No users found in the system.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedUser && (
        <WalletModal 
          user={selectedUser} 
          onClose={() => setSelectedUser(null)} 
          onUpdate={fetchUsers} 
        />
      )}
    </div>
  );
};

export default UsersScreen;
