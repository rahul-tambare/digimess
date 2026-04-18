import { useState, useEffect } from 'react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import KPICard from '../components/common/KPICard';
import { CreditCard, Users, TrendingUp, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import * as subsApi from '../api/subscriptions';

export default function Subscriptions() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await subsApi.getAll();
        setSubs(res.data);
      } catch (err) {
        toast.error('Failed to load subscriptions');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeSubs = subs.filter(s => s.status === 'active');
  const expiredSubs = subs.filter(s => s.status !== 'active');

  const filtered = tab === 'all' ? subs
    : tab === 'active' ? activeSubs
    : expiredSubs;

  const kpis = [
    { label: 'Active Subscriptions', value: String(activeSubs.length), icon: <CreditCard size={22} />, trend: 0, color: 'blue' },
    { label: 'Total Subscribers', value: String(subs.length), icon: <Users size={22} />, trend: 0, color: 'green' },
    { label: 'Expired / Cancelled', value: String(expiredSubs.length), icon: <TrendingUp size={22} />, trend: 0, color: 'purple' },
  ];

  const columns = [
    {
      key: 'customerName', label: 'Customer',
      render: (v, row) => (
        <div className="user-cell-info">
          <span className="user-cell-name">{v || 'Unknown'}</span>
          <span className="user-cell-phone">{row.customerPhone || ''}</span>
        </div>
      ),
    },
    { key: 'planName', label: 'Plan', render: v => v || '—' },
    {
      key: 'type', label: 'Type',
      render: v => (
        <span style={{
          fontSize: '0.78rem', fontWeight: 500, padding: '0.2rem 0.5rem',
          borderRadius: '6px',
          background: v === 'multi_mess' ? 'rgba(168,85,247,0.12)' : 'var(--accent-light)',
          color: v === 'multi_mess' ? '#a855f7' : 'var(--accent)',
        }}>
          {v === 'multi_mess' ? 'Multi-Mess' : 'Single Mess'}
        </span>
      ),
    },
    {
      key: 'mealsRemaining', label: 'Meals',
      render: (v, row) => {
        const total = parseInt(row.totalMeals) || 1;
        const remaining = parseInt(v) || 0;
        const pct = ((total - remaining) / total) * 100;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 60, height: 6, background: 'var(--bg-primary)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: `${Math.min(pct, 100)}%`, height: '100%',
                background: pct > 80 ? 'var(--danger)' : pct > 50 ? 'var(--warning)' : 'var(--success)',
                borderRadius: 3
              }} />
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{remaining}/{total}</span>
          </div>
        );
      },
    },
    {
      key: 'startDate', label: 'Period',
      render: (v, row) => (
        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          <Calendar size={12} style={{ display: 'inline', verticalAlign: '-1px', marginRight: '0.3rem' }} />
          {v ? new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '?'} — {row.endDate ? new Date(row.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '?'}
        </span>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: v => <StatusBadge status={v || 'unknown'} />,
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Subscriptions</h1>
          <p className="page-subtitle">Manage meal plan subscriptions</p>
        </div>
      </div>

      <div className="dashboard-kpis" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {kpis.map(k => <KPICard key={k.label} {...k} />)}
      </div>

      <div className="tabs">
        {['all', 'active', 'expired'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            <span style={{ marginLeft: '0.4rem', fontSize: '0.75rem', opacity: 0.6 }}>
              ({t === 'all' ? subs.length : t === 'active' ? activeSubs.length : expiredSubs.length})
            </span>
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No subscriptions found" />
    </div>
  );
}
