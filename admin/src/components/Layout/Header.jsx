import { Search, Bell, Menu } from 'lucide-react';

export default function Header({ onToggleSidebar }) {
  return (
    <header className="header">
      <div className="header-left">
        <button className="header-toggle" onClick={onToggleSidebar}>
          <Menu size={20} />
        </button>
        <div className="header-search">
          <Search size={16} className="header-search-icon" />
          <input type="text" placeholder="Search anything…" />
        </div>
      </div>

      <div className="header-right">
        <button className="header-notif">
          <Bell size={20} />
          <span className="header-notif-badge" />
        </button>
        <div className="header-divider" />
        <div className="header-user">
          <div className="header-user-avatar">RA</div>
          <div className="header-user-info">
            <span>Rahul Admin</span>
            <span>Super Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
