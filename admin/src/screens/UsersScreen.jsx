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
                <th style={{ fontWeight: 800, fontSize: 12, color: 'var(--on-surface-variant)', letterSpacing: 1, textTransform: 'uppercase' }}>Joined</th>
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
                  <td style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>
                    {new Date(user.createdAt).toLocaleDateString()}
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
    </div>
  );
};

export default UsersScreen;
