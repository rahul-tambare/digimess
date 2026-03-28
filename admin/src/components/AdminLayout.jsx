import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Store, LogOut, Bell, Menu, X } from 'lucide-react';

const AdminLayout = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem('adminUser'));

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user || user.role !== 'admin') return null;

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/login');
  };

  const toggleSidebar = () => setSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin-container">
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} 
        onClick={closeSidebar} 
      />

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="flex justify-between items-center" style={{ marginBottom: 48, paddingLeft: 12 }}>
          <div>
            <h2 style={{ color: 'var(--primary)', letterSpacing: '-1px' }}>Digimess</h2>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--on-surface-variant)', letterSpacing: 2 }}>ADMIN PANEL</span>
          </div>
          <button className="mobile-menu-btn" onClick={closeSidebar}>
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-col gap-2" style={{ flex: 1 }}>
          <NavLink to="/" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar} end>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
          <NavLink to="/users" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <Users size={20} /> Users
          </NavLink>
          <NavLink to="/messes" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`} onClick={closeSidebar}>
            <Store size={20} /> Messes
          </NavLink>
        </nav>

        <button onClick={handleLogout} className="btn-primary w-full mt-auto" style={{ background: 'var(--error)' }}>
          <LogOut size={18} /> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <div className="flex items-center gap-4">
            <button className="mobile-menu-btn" onClick={toggleSidebar}>
              <Menu size={24} />
            </button>
            <h3 style={{ fontWeight: 600 }} className="text-sm md-text-base">
              <span style={{ opacity: 0.6, fontWeight: 400 }}>Hello,</span> {user.name}
            </h3>
          </div>
          
          <div className="flex items-center gap-4 md-gap-6">
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative' }}>
              <Bell size={24} color="var(--on-surface-variant)" />
              <span style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, background: 'var(--error)', borderRadius: '50%' }} />
            </button>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
