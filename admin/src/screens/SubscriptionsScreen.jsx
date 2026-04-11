import React, { useState, useEffect } from 'react';
import { Calendar, User, Zap, Clock, CheckCircle } from 'lucide-react';
import api from '../utils/api';

const SubscriptionsScreen = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/subscriptions')
      .then(res => setSubscriptions(res.data))
      .catch(err => console.error('Failed to fetch subscriptions', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{padding: 40, textAlign: 'center', color: 'var(--primary)', fontWeight: 700}}>Loading active subscriptions...</div>;

  return (
    <div className="flex-col gap-6">
      <div className="flex-col md-flex-row md-items-center justify-between gap-4 mb-2">
        <div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)' }}>Subscription Management</h1>
          <p className="text-muted mt-1" style={{fontSize: 'clamp(14px, 2vw, 18px)'}}>View and track all active meal plans across the platform.</p>
        </div>
      </div>

      <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr style={{ background: 'var(--surface-low)' }}>
                <th style={{ fontWeight: 800, fontSize: 12, color: 'var(--on-surface-variant)', letterSpacing: 1, textTransform: 'uppercase' }}>Customer</th>
                <th style={{ fontWeight: 800, fontSize: 12, color: 'var(--on-surface-variant)', letterSpacing: 1, textTransform: 'uppercase' }}>Plan</th>
                <th style={{ fontWeight: 800, fontSize: 12, color: 'var(--on-surface-variant)', letterSpacing: 1, textTransform: 'uppercase' }}>Start Date</th>
                <th style={{ fontWeight: 800, fontSize: 12, color: 'var(--on-surface-variant)', letterSpacing: 1, textTransform: 'uppercase' }}>End Date</th>
                <th style={{ fontWeight: 800, fontSize: 12, color: 'var(--on-surface-variant)', letterSpacing: 1, textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map(sub => (
                <tr key={sub.id}>
                  <td>
                    <div className="flex-col">
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{sub.customerName}</span>
                      <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{sub.customerPhone}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                        <Zap size={14} color="var(--primary)" />
                        <span style={{ fontWeight: 600 }}>{sub.planName}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 14 }}>{new Date(sub.startDate).toLocaleDateString()}</td>
                  <td style={{ fontSize: 14 }}>{new Date(sub.endDate).toLocaleDateString()}</td>
                  <td>
                    <span style={{ 
                      padding: '6px 12px', 
                      borderRadius: 8, 
                      background: sub.isActive ? 'rgba(27, 109, 36, 0.1)' : 'var(--surface-low)', 
                      color: sub.isActive ? 'var(--success)' : 'var(--on-surface-variant)', 
                      fontSize: 11, 
                      fontWeight: 800, 
                      textTransform: 'uppercase' 
                    }}>
                      {sub.isActive ? 'Active' : 'Expired'}
                    </span>
                  </td>
                </tr>
              ))}
              {subscriptions.length === 0 && (
                <tr><td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--on-surface-variant)' }}>No subscriptions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionsScreen;
