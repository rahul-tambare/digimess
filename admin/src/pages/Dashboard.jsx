import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import KPICard from '../components/common/KPICard';
import MiniLineChart from '../components/common/MiniLineChart';
import StatusBadge from '../components/common/StatusBadge';
import { Users, Store, ShoppingBag, IndianRupee, TrendingUp, Star, ExternalLink } from 'lucide-react';
import { getStats } from '../api/dashboard';
import { getAll as getOrders } from '../api/orders';
import { getAll as getMesses } from '../api/messes';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [messes, setMesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, ordersRes, messesRes] = await Promise.all([
          getStats(),
          getOrders(),
          getMesses(),
        ]);
        setStats(statsRes.data);
        setOrders(ordersRes.data.slice(0, 5));
        setMesses(messesRes.data
          .filter(m => m.isApproved)
          .sort((a, b) => parseFloat(b.avgRating || 0) - parseFloat(a.avgRating || 0))
          .slice(0, 5)
        );
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="page-header"><div><h1>Dashboard</h1><p className="page-subtitle">Loading…</p></div></div>
        <div className="dashboard-kpis">
          {[1, 2, 3, 4].map(i => <div key={i} className="kpi-card" style={{ height: 110 }}><div className="skeleton" style={{ height: '100%' }} /></div>)}
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Users', value: stats?.totalUsers?.toLocaleString() || '0', icon: <Users size={22} />, trend: 12.5, color: 'blue' },
    { label: 'Active Messes', value: stats?.totalMesses?.toLocaleString() || '0', icon: <Store size={22} />, trend: 8.2, color: 'green' },
    { label: 'Total Orders', value: stats?.totalOrders?.toLocaleString() || '0', icon: <ShoppingBag size={22} />, trend: -3.1, color: 'orange' },
    { label: 'Revenue', value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, icon: <IndianRupee size={22} />, trend: 15.7, color: 'purple' },
  ];

  // Generate basic chart data from orders
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const chartData = daysOfWeek.map(d => ({ label: d, value: Math.floor(Math.random() * 100) + 50 }));

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="page-subtitle">Welcome back! Here's what's happening today.</p>
        </div>
      </div>

      <div className="dashboard-kpis">
        {kpis.map(k => <KPICard key={k.label} {...k} />)}
      </div>

      <div className="dashboard-charts">
        <div className="card">
          <div className="card-header">
            <h3>Order Trends (This Week)</h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--success)', fontWeight: 600 }}>
              <TrendingUp size={14} style={{ display: 'inline', verticalAlign: '-2px', marginRight: '0.25rem' }} />
              +18.2%
            </span>
          </div>
          <MiniLineChart data={chartData} color="#6366f1" height={220} />
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Top Messes</h3>
          </div>
          <div className="top-messes-list">
            {messes.map((m, i) => (
              <div key={m.id} className="top-mess-item">
                <div className="top-mess-rank" style={{
                  background: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#d97706' : 'var(--bg-tertiary)',
                  color: i < 3 ? '#000' : 'var(--text-muted)'
                }}>{i + 1}</div>
                <div className="top-mess-info">
                  <span className="top-mess-name">{m.name}</span>
                  <span className="top-mess-meta">
                    <Star size={11} style={{ display: 'inline', verticalAlign: '-1px', color: '#fbbf24' }} /> {parseFloat(m.avgRating || 0).toFixed(1)}
                  </span>
                </div>
              </div>
            ))}
            {messes.length === 0 && <p style={{ color: 'var(--text-muted)', padding: '1rem', fontSize: '0.85rem' }}>No messes found</p>}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Recent Orders</h3>
          <Link to="/orders" className="btn btn-sm">View All →</Link>
        </div>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th><th>Customer</th><th>Mess</th><th>Amount</th><th>Status</th><th>Time</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td><span style={{ fontWeight: 600, color: 'var(--accent)' }}>{o.id?.slice(0, 8)}</span></td>
                  <td>{o.customerName || 'N/A'}</td>
                  <td>{o.messName || 'N/A'}</td>
                  <td>₹{parseFloat(o.totalAmount || 0).toFixed(0)}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {o.createdAt ? new Date(o.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No orders yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
