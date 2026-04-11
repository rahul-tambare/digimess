import React, { useState, useEffect } from 'react';
import { IndianRupee, Plus, Edit2, Trash2, Save, X, Info } from 'lucide-react';
import api from '../utils/api';

const ChargeModal = ({ charge, onClose, onUpdate }) => {
  const [formData, setFormData] = useState(charge || {
    name: '',
    type: 'fixed',
    amount: 0,
    appliesTo: 'order',
    isActive: 1
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (charge?.id) {
        await api.put(`/admin/charges/${charge.id}`, formData);
      } else {
        await api.post('/admin/charges', formData);
      }
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Failed to save charge', err);
      alert('Error saving charge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sidebar-overlay open" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card glass" style={{ width: '90%', maxWidth: 450, padding: 32 }}>
        <div className="flex justify-between items-center mb-6">
          <h2>{charge ? 'Edit Charge' : 'New Charge'}</h2>
          <button onClick={onClose} className="btn-secondary" style={{ padding: 8 }}><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-col gap-4">
          <div className="input-group">
            <label>Name</label>
            <input 
              className="input" 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              required 
              placeholder="e.g. Platform Commission"
            />
          </div>
          
          <div className="flex gap-4">
            <div className="input-group flex-1">
              <label>Calculation Type</label>
              <select 
                className="input" 
                value={formData.type} 
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="fixed">Fixed Amount (₹)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div className="input-group flex-1">
              <label>Value</label>
              <input 
                type="number" 
                className="input" 
                value={formData.amount} 
                onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} 
                step="0.01"
              />
            </div>
          </div>

          <div className="input-group">
            <label>Applies To</label>
            <select 
              className="input" 
              value={formData.appliesTo} 
              onChange={e => setFormData({...formData, appliesTo: e.target.value})}
            >
              <option value="order">Per Order</option>
              <option value="recharge">Per Recharge</option>
              <option value="all">Every Transaction</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            <Save size={18} /> {loading ? 'Saving...' : 'Save Charge'}
          </button>
        </form>
      </div>
    </div>
  );
};

const ChargesScreen = () => {
  const [charges, setCharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharge, setSelectedCharge] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchCharges = () => {
    setLoading(true);
    api.get('/admin/charges')
      .then(res => setCharges(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCharges();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this charge?')) {
      try {
        await api.delete(`/admin/charges/${id}`);
        fetchCharges();
      } catch (err) {
        alert('Delete failed');
      }
    }
  };

  if (loading && charges.length === 0) return <div style={{padding: 40, textAlign: 'center'}}>Loading Charges...</div>;

  return (
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1>Admin Charges</h1>
          <p className="text-muted">Configure platform commissions and service fees.</p>
        </div>
        <button className="btn-primary" onClick={() => { setSelectedCharge(null); setIsModalOpen(true); }}>
          <Plus size={18} /> Add Charge
        </button>
      </div>

      <div className="flex items-center gap-3 p-4" style={{ background: 'rgba(var(--primary-rgb), 0.05)', borderRadius: 12 }}>
        <Info size={20} color="var(--primary)" />
        <p className="text-sm" style={{ fontWeight: 500 }}>Active charges are automatically applied to orders and wallet recharges across the platform.</p>
      </div>

      <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-3 gap-6">
        {charges.map(charge => (
          <div key={charge.id} className="card glass flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex-col gap-1">
                <span className="badge" style={{ background: 'var(--surface-low)', fontSize: 10 }}>{charge.appliesTo.toUpperCase()}</span>
                <h3 style={{ fontSize: 16 }}>{charge.name}</h3>
              </div>
              <div className="flex gap-1">
                <button className="btn-secondary" style={{ padding: 8 }} onClick={() => { setSelectedCharge(charge); setIsModalOpen(true); }}>
                   <Edit2 size={16} />
                </button>
                <button className="btn-secondary" style={{ padding: 8, color: 'var(--error)' }} onClick={() => handleDelete(charge.id)}>
                   <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="flex items-end justify-between">
              <div className="flex-col">
                <span className="text-muted" style={{ fontSize: 10 }}>CALCULATION</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary)' }}>
                  {charge.type === 'percentage' ? `${charge.amount}%` : `₹${parseFloat(charge.amount).toFixed(2)}`}
                </span>
              </div>
              {!charge.isActive && <span className="badge" style={{ background: 'var(--error)', color: 'white' }}>INACTIVE</span>}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <ChargeModal 
          charge={selectedCharge} 
          onClose={() => setIsModalOpen(false)} 
          onUpdate={fetchCharges} 
        />
      )}
    </div>
  );
};

export default ChargesScreen;
