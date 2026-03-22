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
      {/* Back button */}
      <button className="btn-secondary" style={{ alignSelf: 'flex-start', padding: '10px 20px' }} onClick={() => navigate('/messes')}>
        <ArrowLeft size={18} /> Back to Messes
      </button>

      {/* Hero */}
      <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
        {images.length > 0 ? (
          <img src={images[0]} alt={mess.name} style={{ width: '100%', height: 280, objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: 280, background: 'var(--surface-low)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>🥘</div>
        )}
        <div style={{ padding: 32 }}>
          <div className="flex justify-between items-center" style={{ marginBottom: 12 }}>
            <h1 style={{ fontSize: '2rem' }}>{mess.name}</h1>
            <div className="flex items-center gap-2" style={{ background: 'var(--surface-low)', padding: '8px 16px', borderRadius: 99 }}>
              <Star size={18} color="#f26d21" fill="#f26d21" />
              <span style={{ fontWeight: 800, fontSize: 16 }}>{mess.rating || 'New'}</span>
            </div>
          </div>
          {mess.address && (
            <div className="flex items-center gap-2 text-muted" style={{ marginBottom: 16 }}>
              <MapPin size={18} /> <span style={{ fontWeight: 500 }}>{mess.address}</span>
            </div>
          )}
          {mess.description && <p className="text-muted" style={{ fontSize: 16, lineHeight: 1.6 }}>{mess.description}</p>}
        </div>
      </div>

      {/* Menu Items */}
      <div>
        <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
          <UtensilsCrossed size={24} color="var(--primary)" />
          <h2>Menu Items</h2>
        </div>
        {mess.menu && mess.menu.length > 0 ? (
          <div className="card glass" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--outline)', background: 'var(--surface)' }}>
                  <th style={{ padding: '14px 24px', fontWeight: 800, fontSize: 12, color: 'var(--on-surface-variant)', letterSpacing: 1, textAlign: 'left' }}>ITEM</th>
                  <th style={{ padding: '14px 24px', fontWeight: 800, fontSize: 12, color: 'var(--on-surface-variant)', letterSpacing: 1, textAlign: 'left' }}>DESCRIPTION</th>
                  <th style={{ padding: '14px 24px', fontWeight: 800, fontSize: 12, color: 'var(--on-surface-variant)', letterSpacing: 1, textAlign: 'right' }}>PRICE</th>
                  <th style={{ padding: '14px 24px', fontWeight: 800, fontSize: 12, color: 'var(--on-surface-variant)', letterSpacing: 1, textAlign: 'center' }}>AVAILABLE</th>
                </tr>
              </thead>
              <tbody>
                {mess.menu.map(item => (
                  <tr key={item.id} className="hover-row" style={{ borderBottom: '1px solid var(--outline)' }}>
                    <td style={{ padding: '14px 24px', fontWeight: 700, fontSize: 15 }}>{item.itemName}</td>
                    <td style={{ padding: '14px 24px', color: 'var(--on-surface-variant)', fontSize: 14 }}>{item.itemDescription || '—'}</td>
                    <td style={{ padding: '14px 24px', fontWeight: 800, color: 'var(--primary)', textAlign: 'right' }}>₹{parseFloat(item.price).toFixed(2)}</td>
                    <td style={{ padding: '14px 24px', textAlign: 'center' }}>
                      <span style={{ padding: '4px 12px', borderRadius: 8, background: item.isAvailable ? '#a0f399' : '#ffdad6', color: item.isAvailable ? '#005312' : '#ba1a1a', fontWeight: 800, fontSize: 12 }}>
                        {item.isAvailable ? 'YES' : 'NO'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card glass" style={{ textAlign: 'center', padding: 40, color: 'var(--on-surface-variant)', fontWeight: 600 }}>
            No menu items added yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default MessDetailScreen;
