import React, { useState, useEffect } from 'react';
import { MapPin, Calendar } from 'lucide-react';
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1>Messes Directory</h1>
          <p className="text-muted mt-2" style={{fontSize: 18}}>Manage partner kitchens and food providers.</p>
        </div>
        <button className="btn-primary" style={{padding: '16px 32px', fontSize: 16}}>Add New Mess</button>
      </div>

      <div className="flex-col gap-4">
        {messes.map(mess => (
          <div key={mess.id} className="card glass flex items-center justify-between" style={{padding: '24px 32px'}}>
            <div className="flex items-center gap-6">
              <div style={{ width: 72, height: 72, borderRadius: 20, background: 'var(--surface-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                🥘
              </div>
              <div>
                <h3 style={{ marginBottom: 6, fontSize: '1.4rem' }}>{mess.name}</h3>
                <div className="flex items-center gap-6 text-sm text-muted">
                  <span className="flex items-center gap-1.5" style={{fontWeight: 500}}><MapPin size={16} /> {mess.address || 'Address not provided'}</span>
                  <span className="flex items-center gap-1.5" style={{fontWeight: 500}}><Calendar size={16} /> Joined {new Date(mess.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div>
              <button className="btn-secondary" style={{ padding: '12px 24px', fontSize: 14 }} onClick={() => navigate(`/messes/${mess.id}`)}>View Details</button>
            </div>
          </div>
        ))}
        {messes.length === 0 && (
          <div className="card glass" style={{ textAlign: 'center', padding: 60, color: 'var(--on-surface-variant)', fontSize: 18, fontWeight: 600 }}>
            No messes registered yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default MessesScreen;
