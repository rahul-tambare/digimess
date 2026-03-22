import React, { useState, useEffect } from 'react';
import { Users, Store, DollarSign, Activity } from 'lucide-react';
import api from '../utils/api';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="card glass flex items-center gap-6" style={{ flex: 1, minWidth: 240 }}>
    <div style={{ width: 64, height: 64, borderRadius: 20, background: `${color}20`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={32} />
    </div>
    <div>
      <p className="text-muted" style={{ fontWeight: 800, fontSize: 11, letterSpacing: 1.5, marginBottom: 4 }}>{title}</p>
      <h2 style={{ fontSize: '2.5rem', fontWeight: 900 }}>{value}</h2>
    </div>
  </div>
);

const DashboardScreen = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalMesses: 0, totalRevenue: 0, activeSubs: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(res => setStats(res.data))
      .catch(err => console.error('Failed to load stats', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{padding: 40, textAlign: 'center', color: 'var(--primary)', fontWeight: 700}}>Loading dashboard metrics...</div>;

  return (
    <div className="flex-col gap-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1>Platform Overview</h1>
          <p className="text-muted mt-2" style={{fontSize: 18}}>Real-time statistics for Digimess</p>
        </div>
      </div>

      <div className="flex gap-6" style={{ flexWrap: 'wrap' }}>
        <StatCard title="TOTAL USERS" value={stats.totalUsers} icon={Users} color="#1b6d24" />
        <StatCard title="PARTNER MESSES" value={stats.totalMesses} icon={Store} color="#a14000" />
        <StatCard title="ACTIVE SUBS" value={stats.activeSubs} icon={Activity} color="#005fb8" />
        <StatCard title="TOTAL REVENUE" value={`₹${stats.totalRevenue}`} icon={DollarSign} color="#ba1a1a" />
      </div>

      <div className="card glass mt-6" style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         <div className="flex-col items-center">
            <Activity size={48} color="var(--primary)" style={{opacity: 0.2, marginBottom: 16}} />
            <h3 className="text-muted">Activity Graph</h3>
            <p className="text-muted" style={{fontSize: 14, marginTop: 4}}>Revenue trends will be displayed here.</p>
         </div>
      </div>
    </div>
  );
};

export default DashboardScreen;
