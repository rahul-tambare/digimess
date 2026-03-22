import React, { useState, useEffect } from 'react';
import { Mail, Phone, Wallet } from 'lucide-react';
import api from '../utils/api';

const UsersScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error('Failed to view users', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{padding: 40, textAlign: 'center', color: 'var(--primary)', fontWeight: 700}}>Loading user database...</div>;

  return (
    <div className="flex-col gap-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1>User Management</h1>
          <p className="text-muted mt-2" style={{fontSize: 18}}>View and manage all registered users on Digimess.</p>
        </div>
      </div>

      <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--outline)', background: 'var(--surface)' }}>
              <th style={{ padding: '16px 24px', fontWeight: 800, fontSize: 13, color: 'var(--on-surface-variant)', letterSpacing: 1 }}>USER</th>
              <th style={{ padding: '16px 24px', fontWeight: 800, fontSize: 13, color: 'var(--on-surface-variant)', letterSpacing: 1 }}>CONTACT</th>
              <th style={{ padding: '16px 24px', fontWeight: 800, fontSize: 13, color: 'var(--on-surface-variant)', letterSpacing: 1 }}>ROLE</th>
              <th style={{ padding: '16px 24px', fontWeight: 800, fontSize: 13, color: 'var(--on-surface-variant)', letterSpacing: 1 }}>WALLET</th>
              <th style={{ padding: '16px 24px', fontWeight: 800, fontSize: 13, color: 'var(--on-surface-variant)', letterSpacing: 1 }}>JOINED</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--outline)', transition: 'background 0.2s' }} className="hover-row">
                <td style={{ padding: '16px 24px' }}>
                  <div className="flex items-center gap-3">
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary-fixed)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18 }}>
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 16 }}>{user.name || 'Anonymous User'}</span>
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <div className="flex-col gap-1">
                    <span className="flex items-center gap-2 text-sm"><Mail size={16} className="text-muted"/> {user.email || 'N/A'}</span>
                    <span className="flex items-center gap-2 text-sm"><Phone size={16} className="text-muted"/> {user.phone}</span>
                  </div>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span style={{ padding: '6px 12px', borderRadius: 8, background: user.role === 'admin' ? 'var(--primary-fixed)' : 'var(--surface-low)', color: user.role === 'admin' ? 'var(--primary)' : 'var(--on-surface)', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '16px 24px' }}>
                  <span className="flex items-center gap-2" style={{ fontWeight: 800, fontSize: 16 }}>
                    <Wallet size={18} color="var(--success)" /> ₹{parseFloat(user.walletBalance).toFixed(2)}
                  </span>
                </td>
                <td style={{ padding: '16px 24px', color: 'var(--on-surface-variant)', fontSize: 15, fontWeight: 500 }}>
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--on-surface-variant)' }}>No users found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersScreen;
