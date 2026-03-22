import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Store, LogOut, Bell } from 'lucide-react';

const AdminLayout = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('adminUser'));

  if (!user || user.role !== 'admin') {
    // If not admin, redirect to login
    React.useEffect(() => {
        navigate('/login');
    }, []);
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/login');
  };

  return (
    <div className="flex" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{ width: 280, background: 'var(--surface-high)', borderRight: '1px solid var(--outline)', padding: '32px 24px', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        <div style={{ marginBottom: 48, paddingLeft: 12 }}>
          <h2 style={{ color: 'var(--primary)', letterSpacing: '-1px' }}>Digimess</h2>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface-variant)', letterSpacing: 2 }}>ADMIN PANEL</span>
        </div>
        
        <nav className="flex-col gap-2" style={{ flex: 1 }}>
          <NavLink to="/" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} end>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          <NavLink to="/users" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            <Users size={20} /> Users
          </NavLink>
          <NavLink to="/messes" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>
            <Store size={20} /> Messes
          </NavLink>
        </nav>

        <button onClick={handleLogout} className="btn-secondary w-full" style={{ marginTop: 'auto', background: 'var(--error)', color: 'white' }}>
          <LogOut size={18} /> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-col" style={{ flex: 1, overflow: 'hidden' }}>
        {/* Header */}
        <header className="flex justify-between items-center" style={{ padding: '24px 40px', background: 'var(--surface-high)', borderBottom: '1px solid var(--outline)', zIndex: 5 }}>
          <h3 style={{ fontWeight: 600 }}>Welcome back, {user.name}</h3>
          <div className="flex items-center gap-6">
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
              <Bell size={24} color="var(--on-surface-variant)" />
              <span style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, background: 'var(--error)', borderRadius: '50%' }} />
            </button>
            <div className="flex items-center gap-4">
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 18 }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, overflowY: 'auto', padding: 40, background: 'var(--surface-low)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
