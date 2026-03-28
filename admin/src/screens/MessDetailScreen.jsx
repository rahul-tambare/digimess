import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, ArrowLeft, UtensilsCrossed, Star } from 'lucide-react';
import api from '../utils/api';

const MessDetailScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mess, setMess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/messes/${id}`)
      .then(res => setMess(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--primary)', fontWeight: 700 }}>Loading mess details...</div>;
  if (!mess) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--error)', fontWeight: 700 }}>Mess not found.</div>;

  const images = (() => {
    try { return Array.isArray(mess.images) ? mess.images : JSON.parse(mess.images || '[]'); }
    catch { return []; }
  })();

  return (
    <div className="flex-col gap-6">
      <button className="btn-secondary w-full md-w-auto" style={{ alignSelf: 'flex-start', padding: '10px 20px' }} onClick={() => navigate('/messes')}>
        <ArrowLeft size={18} /> Back to Messes
      </button>

      <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
        {images.length > 0 ? (
          <img src={images[0]} alt={mess.name} style={{ width: '100%', height: 'auto', maxHeight: 400, objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: 200, background: 'var(--surface-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🥘</div>
        )}
        <div style={{ padding: '24px 32px' }}>
          <div className="flex-col md-flex-row md-items-center justify-between gap-4 mb-4">
            <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>{mess.name}</h1>
            <div className="flex items-center gap-2 self-start md-self-auto" style={{ background: 'rgba(var(--primary-rgb), 0.1)', padding: '8px 16px', borderRadius: 99 }}>
              <Star size={18} color="var(--primary)" fill="var(--primary)" />
              <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--primary)' }}>{mess.rating || 'New'}</span>
            </div>
          </div>
          {mess.address && (
            <div className="flex items-start gap-2 text-muted mb-4">
              <MapPin size={18} style={{ marginTop: 2, flexShrink: 0 }} /> 
              <span style={{ fontWeight: 500, fontSize: 14 }}>{mess.address}</span>
            </div>
          )}
          {mess.description && <p className="text-muted" style={{ fontSize: 15, lineHeight: 1.6 }}>{mess.description}</p>}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-4">
          <UtensilsCrossed size={20} color="var(--primary)" />
          <h2 style={{ fontSize: '1.25rem' }}>Menu Items</h2>
        </div>
        {mess.menu && mess.menu.length > 0 ? (
          <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-container">
              <table>
                <thead>
                  <tr style={{ background: 'var(--surface-low)' }}>
                    <th style={{ fontWeight: 800, fontSize: 12, color: 'var(--on-surface-variant)', letterSpacing: 1 }}>ITEM</th>
                    <th style={{ fontWeight: 800, fontSize: 12, color: 'var(--on-surface-variant)', letterSpacing: 1 }}>DESCRIPTION</th>
                    <th style={{ fontWeight: 800, fontSize: 12, color: 'var(--on-surface-variant)', letterSpacing: 1, textAlign: 'right' }}>PRICE</th>
                    <th style={{ fontWeight: 800, fontSize: 12, color: 'var(--on-surface-variant)', letterSpacing: 1, textAlign: 'center' }}>AVAIL</th>
                  </tr>
                </thead>
                <tbody>
                  {mess.menu.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700, fontSize: 14 }}>{item.itemName}</td>
                      <td style={{ color: 'var(--on-surface-variant)', fontSize: 13 }}>{item.itemDescription || '—'}</td>
                      <td style={{ fontWeight: 800, color: 'var(--primary)', textAlign: 'right' }}>₹{parseFloat(item.price).toFixed(2)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 8, background: item.isAvailable ? 'rgba(27, 109, 36, 0.1)' : 'rgba(186, 26, 26, 0.1)', color: item.isAvailable ? 'var(--success)' : 'var(--error)', fontWeight: 800, fontSize: 11 }}>
                          {item.isAvailable ? 'YES' : 'NO'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card glass" style={{ textAlign: 'center', padding: 40, color: 'var(--on-surface-variant)' }}>
            No menu items listed yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default MessDetailScreen;
