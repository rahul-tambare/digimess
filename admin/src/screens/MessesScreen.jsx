import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const MessesScreen = () => {
  const [messes, setMesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/admin/messes')
      .then(res => setMesses(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{padding: 40, textAlign: 'center', color: 'var(--primary)', fontWeight: 700}}>Loading partner messes...</div>;

  return (
    <div className="flex-col gap-6">
      <div className="flex-col md-flex-row md-items-center justify-between gap-4 mb-2">
        <div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)' }}>Messes Directory</h1>
          <p className="text-muted mt-1" style={{fontSize: 'clamp(14px, 2vw, 18px)'}}>Partner kitchens and meal providers.</p>
        </div>
        <button className="btn-primary w-full md-w-auto">
          <Plus size={20} /> Add New Mess
        </button>
      </div>

      <div className="flex-col gap-4">
        {messes.map(mess => (
          <div key={mess.id} className="card glass flex-col md-flex-row md-items-center justify-between gap-6" style={{padding: '24px'}}>
            <div className="flex items-center gap-4 md-gap-6">
              <div style={{ width: 64, height: 64, borderRadius: 20, background: 'var(--surface-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
                🥘
              </div>
              <div style={{ overflow: 'hidden' }}>
                <h3 style={{ marginBottom: 4, fontSize: '1.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{mess.name}</h3>
                <div className="flex-col md-flex-row md-items-center gap-2 md-gap-6 text-sm text-muted">
                  <span className="flex items-center gap-1.5" style={{fontWeight: 500}}><MapPin size={14} /> {mess.address || 'Address not provided'}</span>
                  <span className="flex items-center gap-1.5" style={{fontWeight: 500}}><Calendar size={14} /> Joined {new Date(mess.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div className="w-full md-w-auto">
              <button className="btn-secondary w-full md-w-auto" style={{ padding: '10px 20px', fontSize: 13 }} onClick={() => navigate(`/messes/${mess.id}`)}>View Details</button>
            </div>
          </div>
        ))}
        {messes.length === 0 && (
          <div className="card glass" style={{ textAlign: 'center', padding: 60, color: 'var(--on-surface-variant)' }}>
            <p style={{ fontSize: 18, fontWeight: 600 }}>No partner messes registered yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessesScreen;
