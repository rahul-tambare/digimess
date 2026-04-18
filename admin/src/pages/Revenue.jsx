import { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, Wallet } from 'lucide-react';
import KPICard from '../components/common/KPICard';
import DataTable from '../components/common/DataTable';
import MiniLineChart from '../components/common/MiniLineChart';
import DonutChart from '../components/common/DonutChart';
import toast from 'react-hot-toast';
import * as revenueApi from '../api/revenue';

const donutColors = ['#6366f1', '#22c55e', '#f59e0b', '#a855f7', '#ef4444'];

export default function Revenue() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = async () => {
    setLoading(true);
    try {
      const res = await revenueApi.getRevenue({ page, limit: 10 });
      setData(res.data);
    } catch (err) {
      toast.error('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page]);

  if (loading) {
    return (
      <div className="page">
        <div className="page-header"><div><h1>Revenue</h1><p className="page-subtitle">Loading…</p></div></div>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Revenue', value: `₹${(data?.totalRevenue || 0).toLocaleString()}`, icon: <IndianRupee size={22} />, trend: 0, color: 'green' },
    { label: 'This Month', value: `₹${(data?.monthRevenue || 0).toLocaleString()}`, icon: <TrendingUp size={22} />, trend: 0, color: 'blue' },
    { label: 'Transactions', value: String(data?.transactions?.pagination?.total || 0), icon: <Wallet size={22} />, trend: 0, color: 'purple' },
  ];

  const chartData = (data?.monthlyTrend || []).map(m => ({
    label: m.label,
    value: parseFloat(m.value),
  }));

  const donutSegments = (data?.breakdown || []).map((b, i) => ({
    label: b.category,
    value: parseFloat(b.total),
    color: donutColors[i % donutColors.length],
  }));

  const txCols = [
    {
      key: 'id', label: 'ID',
      render: v => <span style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)' }}>{String(v).slice(0, 8)}</span>,
    },
    { key: 'user', label: 'User', render: v => v || '—' },
    {
      key: 'type', label: 'Type',
      render: v => (
        <span style={{
          fontSize: '0.78rem', fontWeight: 600, padding: '0.2rem 0.5rem',
          borderRadius: '6px',
          background: v === 'credit' ? 'var(--success-light)' : 'var(--danger-light)',
          color: v === 'credit' ? 'var(--success)' : 'var(--danger)',
        }}>
          {v === 'credit' ? '+ Credit' : '− Debit'}
        </span>
      ),
    },
    {
      key: 'amount', label: 'Amount',
      render: (v, row) => (
        <span style={{ fontWeight: 600, color: row.type === 'credit' ? 'var(--success)' : 'var(--text-primary)' }}>
          ₹{parseFloat(v).toLocaleString()}
        </span>
      ),
    },
    { key: 'description', label: 'Description', render: v => v || '—' },
    {
      key: 'date', label: 'Date',
      render: v => {
        if (!v) return '—';
        const d = new Date(v);
        return (
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            {d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        );
      },
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Revenue</h1>
          <p className="page-subtitle">Financial overview and transactions</p>
        </div>
      </div>

      <div className="revenue-kpis">
        {kpis.map(k => <KPICard key={k.label} {...k} />)}
      </div>

      <div className="revenue-charts">
        <div className="card">
          <div className="card-header">
            <h3>Revenue Trend</h3>
          </div>
          {chartData.length > 0 ? (
            <MiniLineChart data={chartData} color="#22c55e" height={240} />
          ) : (
            <p style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>No trend data available</p>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Revenue Breakdown</h3>
          </div>
          {donutSegments.length > 0 ? (
            <DonutChart segments={donutSegments} size={180} />
          ) : (
            <p style={{ color: 'var(--text-muted)', padding: '2rem', textAlign: 'center' }}>No breakdown available</p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Recent Transactions</h3>
        </div>
        <DataTable
          columns={txCols}
          data={data?.transactions?.data || []}
          emptyMessage="No transactions yet"
          serverSide
          total={data?.transactions?.pagination?.total || 0}
          page={page}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
