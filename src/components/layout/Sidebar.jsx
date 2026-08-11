import { NavLink } from 'react-router-dom';
import { TrendingUp, LogOut } from 'lucide-react';
import { NAV_ITEMS } from './navigation.js';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

function initials(name) {
  return (name || 'Client')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Sidebar() {
  const { profile } = useData();
  const { user, isConfigured, logout } = useAuth();

  const displayName = profile.display_name || user?.displayName || user?.email || 'Demo Client';

  // Group nav items by their section label, preserving order.
  const sections = [];
  for (const item of NAV_ITEMS) {
    let group = sections.find((s) => s.label === item.section);
    if (!group) {
      group = { label: item.section, items: [] };
      sections.push(group);
    }
    group.items.push(item);
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">
          <TrendingUp size={19} strokeWidth={2.4} />
        </div>
        <div>
          <div className="sidebar-brand-name">Adviser</div>
          <div className="sidebar-brand-sub">Personal Finance HQ</div>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.label}>
          <div className="sidebar-section-label">{section.label}</div>
          {section.items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              >
                <Icon size={18} strokeWidth={2} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      ))}

      <div className="sidebar-footer">
        <div className="avatar">{initials(displayName)}</div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{ color: 'var(--sidebar-fg)', fontWeight: 550, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {displayName}
          </div>
          <div style={{ color: 'var(--sidebar-muted)', fontSize: 11 }}>
            {profile.base_currency} · {profile.risk_tolerance}
          </div>
        </div>
        {isConfigured && user && (
          <button
            className="sidebar-logout"
            onClick={logout}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
