import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Edit2, Trash2, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../utils/api';

const FAQModal = ({ faq, onClose, onUpdate }) => {
  const [formData, setFormData] = useState(faq || {
    question: '',
    answer: '',
    category: 'general',
    displayOrder: 0,
    isActive: 1
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (faq?.id) {
        await api.put(`/admin/faqs/${faq.id}`, formData);
      } else {
        await api.post('/admin/faqs', formData);
      }
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Failed to save FAQ', err);
      alert('Error saving FAQ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sidebar-overlay open" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card glass" style={{ width: '90%', maxWidth: 500, padding: 32 }}>
        <div className="flex justify-between items-center mb-6">
          <h2>{faq ? 'Edit FAQ' : 'New FAQ'}</h2>
          <button onClick={onClose} className="btn-secondary" style={{ padding: 8 }}><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-col gap-4">
          <div className="input-group">
            <label>Question</label>
            <input 
              className="input" 
              value={formData.question} 
              onChange={e => setFormData({...formData, question: e.target.value})} 
              required 
            />
          </div>
          <div className="input-group">
            <label>Answer</label>
            <textarea 
              className="input" 
              value={formData.answer} 
              onChange={e => setFormData({...formData, answer: e.target.value})} 
              required 
              rows={4}
            />
          </div>
          <div className="flex gap-4">
            <div className="input-group flex-1">
              <label>Category</label>
              <select 
                className="input" 
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="general">General</option>
                <option value="orders">Orders</option>
                <option value="payments">Payments</option>
                <option value="wallet">Wallet</option>
              </select>
            </div>
            <div className="input-group flex-1">
              <label>Display Order</label>
              <input 
                type="number" 
                className="input" 
                value={formData.displayOrder} 
                onChange={e => setFormData({...formData, displayOrder: parseInt(e.target.value)})} 
              />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            <Save size={18} /> {loading ? 'Saving...' : 'Save FAQ'}
          </button>
        </form>
      </div>
    </div>
  );
};

const FAQsScreen = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFAQ, setSelectedFAQ] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchFAQs = () => {
    setLoading(true);
    api.get('/admin/faqs')
      .then(res => setFaqs(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFAQs();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      try {
        await api.delete(`/admin/faqs/${id}`);
        fetchFAQs();
      } catch (err) {
        alert('Delete failed');
      }
    }
  };

  if (loading && faqs.length === 0) return <div style={{padding: 40, textAlign: 'center'}}>Loading FAQs...</div>;

  return (
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1>FAQs Management</h1>
          <p className="text-muted">Edit the help section for your consumer app.</p>
        </div>
        <button className="btn-primary" onClick={() => { setSelectedFAQ(null); setIsModalOpen(true); }}>
          <Plus size={18} /> Add FAQ
        </button>
      </div>

      <div className="grid gap-4">
        {faqs.map(faq => (
          <div key={faq.id} className="card glass flex justify-between items-start gap-4">
            <div className="flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="badge" style={{ background: 'var(--surface-low)', fontSize: 10 }}>{faq.category.toUpperCase()}</span>
                <span className="text-muted" style={{ fontSize: 10 }}>ORDER: {faq.displayOrder}</span>
                {!faq.isActive && <span className="badge" style={{ background: 'var(--error)', color: 'white' }}>INACTIVE</span>}
              </div>
              <h3 style={{ fontSize: 16 }}>{faq.question}</h3>
              <p className="text-sm text-muted">{faq.answer}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary" style={{ padding: 8 }} onClick={() => { setSelectedFAQ(faq); setIsModalOpen(true); }}>
                <Edit2 size={16} />
              </button>
              <button className="btn-secondary" style={{ padding: 8, color: 'var(--error)' }} onClick={() => handleDelete(faq.id)}>
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <FAQModal 
          faq={selectedFAQ} 
          onClose={() => setIsModalOpen(false)} 
          onUpdate={fetchFAQs} 
        />
      )}
    </div>
  );
};

export default FAQsScreen;
