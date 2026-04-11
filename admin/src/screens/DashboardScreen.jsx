import React, { useState, useEffect } from 'react';
import { Users, Store, DollarSign, Activity } from 'lucide-react';
import api from '../utils/api';

import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, color, link }) => (
  <Link to={link || '#'} className="card glass flex items-center gap-4 md-gap-6" style={{ textDecoration: 'none', color: 'inherit' }}>
    <div style={{ 
      width: 56, 
      height: 56, 
      borderRadius: 16, 
      background: `${color}15`, 
      color: color, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      flexShrink: 0
    }}>
      <Icon size={28} />
    </div>
    <div style={{ overflow: 'hidden' }}>
      <p className="text-muted" style={{ fontWeight: 800, fontSize: 10, letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>{title}</p>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 900, lineHeight: 1.2 }}>{value}</h2>
    </div>
  </Link>
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
      <div className="flex-col md-flex-row md-items-center justify-between gap-4 mb-2">
        <div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)' }}>Platform Overview</h1>
          <p className="text-muted mt-1" style={{fontSize: 'clamp(14px, 2vw, 18px)'}}>Real-time metrics for your ecosystem</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard title="TOTAL USERS" value={stats.totalUsers} icon={Users} color="#1b6d24" link="/users" />
        <StatCard title="PARTNER MESSES" value={stats.totalMesses} icon={Store} color="#a14000" link="/messes" />
        <StatCard title="ACTIVE SUBS" value={stats.activeSubs} icon={Activity} color="#005fb8" link="/subscriptions" />
        <StatCard title="TOTAL REVENUE" value={`₹${stats.totalRevenue}`} icon={DollarSign} color="#ba1a1a" link="/orders" />
      </div>


      <div className="card glass mt-4" style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         <div className="flex-col items-center text-center p-6">
            <Activity size={48} color="var(--primary)" style={{opacity: 0.2, marginBottom: 16}} />
            <h3 className="text-muted">Activity Insights</h3>
            <p className="text-muted" style={{fontSize: 14, marginTop: 4, maxWidth: 300}}>Visualization of growth and revenue trends will be integrated here.</p>
         </div>
      </div>
    </div>
  );
};

export default DashboardScreen;
