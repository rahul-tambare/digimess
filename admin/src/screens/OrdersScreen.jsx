import React, { useState, useEffect } from 'react';
import { ShoppingBag, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import api from '../utils/api';

const OrdersScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/orders')
      .then(res => setOrders(res.data))
      .catch(err => console.error('Failed to fetch orders', err))
      .finally(() => setLoading(false));
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'delivered': return { bg: 'rgba(27, 109, 36, 0.1)', color: 'var(--success)' };
      case 'cancelled': return { bg: 'rgba(186, 26, 26, 0.1)', color: 'var(--error)' };
      case 'confirmed': return { bg: 'rgba(0, 95, 184, 0.1)', color: '#005fb8' };
      default: return { bg: 'var(--surface-low)', color: 'var(--on-surface-variant)' };
    }
  };

  if (loading) return <div style={{padding: 40, textAlign: 'center', color: 'var(--primary)', fontWeight: 700}}>Loading platform orders...</div>;

  return (
    <div className="flex-col gap-6">
      <div className="flex-col md-flex-row md-items-center justify-between gap-4 mb-2">
        <div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)' }}>Order History</h1>
          <p className="text-muted mt-1" style={{fontSize: 'clamp(14px, 2vw, 18px)'}}>Monitor and manage all meal orders across the platform.</p>
        </div>
      </div>

      <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr style={{ background: 'var(--surface-low)' }}>
                <th style={{ fontWeight: 800, fontSize: 12, color: 'var(--on-surface-variant)', letterSpacing: 1, textTransform: 'uppercase' }}>Order ID</th>
                <th style={{ fontWeight: 800, fontSize: 12, color: 'var(--on-surface-variant)', letterSpacing: 1, textTransform: 'uppercase' }}>Customer</th>
                <th style={{ fontWeight: 800, fontSize: 12, color: 'var(--on-surface-variant)', letterSpacing: 1, textTransform: 'uppercase' }}>Mess</th>
                <th style={{ fontWeight: 800, fontSize: 12, color: 'var(--on-surface-variant)', letterSpacing: 1, textTransform: 'uppercase' }}>Amount</th>
                <th style={{ fontWeight: 800, fontSize: 12, color: 'var(--on-surface-variant)', letterSpacing: 1, textTransform: 'uppercase' }}>Status</th>
                <th style={{ fontWeight: 800, fontSize: 12, color: 'var(--on-surface-variant)', letterSpacing: 1, textTransform: 'uppercase' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => {
                const style = getStatusStyle(order.status);
                return (
                  <tr key={order.id}>
                    <td>
                      <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary)' }}>#{order.id.slice(0, 8).toUpperCase()}</span>
                    </td>
                    <td>
                      <div className="flex-col">
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{order.customerName}</span>
                        <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{order.customerPhone}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{order.messName}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800 }}>₹{parseFloat(order.totalAmount).toFixed(2)}</span>
                    </td>
                    <td>
                      <span style={{ 
                        padding: '6px 12px', 
                        borderRadius: 8, 
                        background: style.bg, 
                        color: style.color, 
                        fontSize: 11, 
                        fontWeight: 800, 
                        textTransform: 'uppercase',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        {order.status === 'delivered' && <CheckCircle size={12} />}
                        {order.status === 'cancelled' && <XCircle size={12} />}
                        {['pending', 'confirmed', 'preparing', 'out_for_delivery'].includes(order.status) && <Clock size={12} />}
                        {order.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {orders.length === 0 && (
                <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'var(--on-surface-variant)' }}>No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrdersScreen;
