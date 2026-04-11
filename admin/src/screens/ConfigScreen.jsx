import React, { useState, useEffect } from 'react';
import { Settings, Save, Info, Image as ImageIcon, Type } from 'lucide-react';
import api from '../utils/api';

const ConfigScreen = () => {
  const [config, setConfig] = useState({
    hero_title: '',
    hero_subtitle: '',
    hero_image: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/admin/config')
      .then(res => setConfig(prev => ({ ...prev, ...res.data })))
      .catch(err => console.error('Failed to fetch config', err))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.post('/admin/config', config);
      setMessage('Configuration saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Failed to save config', err);
      setMessage('Error saving configuration.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{padding: 40, textAlign: 'center', color: 'var(--primary)', fontWeight: 700}}>Loading app settings...</div>;

  return (
    <div className="flex-col gap-6">
      <div className="flex-col md-flex-row md-items-center justify-between gap-4 mb-2">
        <div>
          <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)' }}>App Configuration</h1>
          <p className="text-muted mt-1" style={{fontSize: 'clamp(14px, 2vw, 18px)'}}>Global settings and branding for the Digimess consumer app.</p>
        </div>
      </div>

      <div className="card glass" style={{ maxWidth: 800 }}>
        <form onSubmit={handleSave} className="flex-col gap-6">
          <div className="flex items-center gap-3 p-4" style={{ background: 'rgba(var(--primary-rgb), 0.05)', borderRadius: 12 }}>
            <Info size={20} color="var(--primary)" />
            <p className="text-sm" style={{ fontWeight: 500 }}>The following settings update the "Hero" section of the customer mobile app in real-time.</p>
          </div>

          <div className="input-group">
            <label className="flex items-center gap-2" style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>
              <Type size={16} /> Hero Title
            </label>
            <input 
              name="hero_title"
              value={config.hero_title}
              onChange={handleChange}
              placeholder="e.g., Delicious Meals Delivered"
              className="input"
            />
          </div>

          <div className="input-group">
            <label className="flex items-center gap-2" style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>
              <Type size={16} /> Hero Subtitle
            </label>
            <textarea 
              name="hero_subtitle"
              value={config.hero_subtitle}
              onChange={handleChange}
              placeholder="e.g., Get home-cooked food from local messes."
              className="input"
              rows={3}
              style={{ resize: 'none' }}
            />
          </div>

          <div className="input-group">
            <label className="flex items-center gap-2" style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', color: 'var(--on-surface-variant)' }}>
              <ImageIcon size={16} /> Hero Image URL
            </label>
            <input 
              name="hero_image"
              value={config.hero_image}
              onChange={handleChange}
              placeholder="https://example.com/hero.jpg"
              className="input"
            />
            {config.hero_image && (
                <div style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden', height: 120, border: '1px solid var(--outline)' }}>
                    <img src={config.hero_image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
            )}
          </div>

          {message && (
            <div style={{ padding: '12px 16px', borderRadius: 8, background: message.includes('Error') ? 'var(--error)' : 'var(--success)', color: 'white', fontWeight: 600, textAlign: 'center' }}>
              {message}
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary" style={{ alignSelf: 'flex-start', padding: '16px 40px' }}>
            {saving ? 'Saving...' : <><Save size={20} /> Save Changes</>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ConfigScreen;
