import { useState, useEffect } from 'react';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import { Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import * as ordersApi from '../api/orders';

const statuses = ['all', 'pending', 'accepted', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'rejected'];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await ordersApi.getAll();
        setOrders(res.data);
      } catch (err) {
        toast.error('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = tab === 'all' ? orders : orders.filter(o => o.status === tab);

  const statusCounts = statuses.reduce((acc, s) => {
    acc[s] = s === 'all' ? orders.length : orders.filter(o => o.status === s).length;
    return acc;
  }, {});

  const columns = [
    {
      key: 'id', label: 'Order ID',
      render: v => <span style={{ fontWeight: 600, color: 'var(--accent)', fontSize: '0.85rem' }}>{v?.slice(0, 8)}</span>,
    },
    {
      key: 'customerName', label: 'Customer',
      render: (v, row) => (
        <div className="user-cell-info">
          <span className="user-cell-name">{v || 'N/A'}</span>
          <span className="user-cell-phone">{row.customerPhone || ''}</span>
        </div>
      ),
    },
    { key: 'messName', label: 'Mess', render: v => v || '—' },
    {
      key: 'totalAmount', label: 'Amount',
      render: v => <span style={{ fontWeight: 600 }}>₹{parseFloat(v || 0).toFixed(0)}</span>,
    },
    {
      key: 'orderType', label: 'Type',
      render: v => (
        <span style={{
          fontSize: '0.78rem', fontWeight: 600, padding: '0.2rem 0.5rem',
          borderRadius: '6px',
          background: v === 'subscription' ? 'rgba(168,85,247,0.12)' : 'var(--accent-light)',
          color: v === 'subscription' ? '#a855f7' : 'var(--accent)',
        }}>
          {v === 'subscription' ? 'Sub' : 'On-Demand'}
        </span>
      ),
    },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    {
      key: 'createdAt', label: 'Date',
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
    {
      key: 'actions', label: '',
      render: (_, row) => (
        <button className="btn btn-sm" onClick={() => setSelectedOrder(row)}><Eye size={13} /> Details</button>
      ),
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Orders</h1>
          <p className="page-subtitle">{orders.length} total orders</p>
        </div>
      </div>

      <div className="tabs" style={{ flexWrap: 'wrap' }}>
        {statuses.map(s => (
          <button key={s} className={`tab ${tab === s ? 'active' : ''}`} onClick={() => setTab(s)}>
            {s.replace(/_/g, ' ')}
            <span style={{ marginLeft: '0.3rem', fontSize: '0.75rem', opacity: 0.6 }}>{statusCounts[s]}</span>
          </button>
        ))}
      </div>

      <DataTable columns={columns} data={filtered} loading={loading} emptyMessage="No orders found" />

      {/* Order Detail Modal */}
      <Modal open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order ${selectedOrder?.id?.slice(0, 8) || ''}`}>
        {selectedOrder && (
          <div className="form">
            <div className="form-row">
              <div className="form-group"><label>Customer</label><input value={selectedOrder.customerName || '—'} readOnly /></div>
              <div className="form-group"><label>Phone</label><input value={selectedOrder.customerPhone || '—'} readOnly /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Mess</label><input value={selectedOrder.messName || '—'} readOnly /></div>
              <div className="form-group"><label>Status</label><input value={selectedOrder.status} readOnly /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Amount</label><input value={`₹${parseFloat(selectedOrder.totalAmount || 0).toFixed(2)}`} readOnly /></div>
              <div className="form-group"><label>Type</label><input value={selectedOrder.orderType || 'on_demand'} readOnly /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Delivery Type</label><input value={selectedOrder.deliveryType || '—'} readOnly /></div>
              <div className="form-group"><label>Date</label><input value={selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString() : '—'} readOnly /></div>
            </div>
            {selectedOrder.specialInstructions && (
              <div className="form-group"><label>Instructions</label><textarea readOnly value={selectedOrder.specialInstructions} /></div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
