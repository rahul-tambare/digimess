import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Store, ShoppingBag,
  CreditCard, BarChart3, Settings, LogOut,
  Utensils, Shield, UserCog
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { label: 'MAIN', type: 'group' },
  { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} />, permission: 'dashboard:read' },
  { path: '/users', label: 'Users', icon: <Users size={20} />, permission: 'users:read' },
  { path: '/messes', label: 'Messes', icon: <Store size={20} />, permission: 'messes:read' },
  { path: '/orders', label: 'Orders', icon: <ShoppingBag size={20} />, permission: 'orders:read' },
  { label: 'BUSINESS', type: 'group' },
  { path: '/subscriptions', label: 'Subscriptions', icon: <CreditCard size={20} />, permission: 'subscriptions:read' },
  { path: '/revenue', label: 'Revenue', icon: <BarChart3 size={20} />, permission: 'revenue:read' },
  { label: 'SYSTEM', type: 'group' },
  { path: '/settings', label: 'Settings', icon: <Settings size={20} />, permission: 'settings:read' },
  { path: '/admin-users', label: 'Admin Users', icon: <UserCog size={20} />, permission: 'admins:read' },
  { path: '/roles', label: 'Roles', icon: <Shield size={20} />, permission: 'roles:read' },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuth();

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AD';

  // Filter nav items based on permissions
  const filteredItems = navItems.filter(item => {
    if (item.type === 'group') return true; // Keep group labels (will be hidden if no children)
    return hasPermission(item.permission);
  });

  // Remove group labels that have no visible children after them
  const visibleItems = filteredItems.filter((item, i) => {
    if (item.type !== 'group') return true;
    // Check if there's at least one non-group item after this before the next group
    for (let j = i + 1; j < filteredItems.length; j++) {
      if (filteredItems[j].type === 'group') return false;
      return true;
    }
    return false;
  });

  const roleName = user?.role?.name || user?.role || 'admin';

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <Utensils size={18} color="#fff" />
        </div>
        <h2>Digimess</h2>
      </div>

      <nav className="sidebar-nav">
        {visibleItems.map((item, i) => {
          if (item.type === 'group') {
            return (
              <div key={i} className="sidebar-nav-group-title">
                <span>{item.label}</span>
              </div>
            );
          }

          const isActive = item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              <span className="sidebar-nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-avatar">{initials}</div>
        <div className="sidebar-footer-info">
          <span>{user?.name || 'Admin'}</span>
          <span>{roleName}</span>
        </div>
        <button className="btn-icon" onClick={() => { logout(); navigate('/login'); }} title="Logout" style={{ marginLeft: 'auto' }}>
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
