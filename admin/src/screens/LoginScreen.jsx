import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/admin-login', {
        email,
        password,
      });

      if (res.data.user.role !== 'admin') {
        setError('Unauthorized: Admin access only.');
        setLoading(false);
        return;
      }
      
      localStorage.setItem('adminToken', res.data.token);
      localStorage.setItem('adminUser', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-low)' }}>
      <div className="glass card" style={{ width: 440, padding: 48, borderRadius: 32 }}>
        <div className="flex-col items-center" style={{ marginBottom: 40, textAlign: 'center' }}>
          <h2 style={{ color: 'var(--primary)', marginBottom: 8 }}>Digimess Admin</h2>
          <p className="text-muted">Sign in to manage the platform</p>
        </div>

        {error && (
          <div className="flex items-center gap-2" style={{ background: 'var(--error)', color: 'white', padding: 16, borderRadius: 12, marginBottom: 24 }}>
            <AlertCircle size={20} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="flex-col gap-6">
          <div className="input-group">
            <label className="input-label">Admin Email</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="email" 
                className="input" 
                style={{ paddingLeft: 56 }}
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
              <Mail size={22} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }} />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="password" 
                className="input" 
                style={{ paddingLeft: 56 }}
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
              <Lock size={22} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: 'var(--on-surface-variant)' }} />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full mt-4" style={{ padding: '16px 24px', fontSize: 16 }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In as Admin'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginScreen;
