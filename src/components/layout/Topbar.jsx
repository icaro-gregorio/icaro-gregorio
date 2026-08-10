import { useLocation } from 'react-router-dom';
import { Moon, Sun, Bell } from 'lucide-react';
import { ROUTE_META } from './navigation.js';
import { useTheme } from '../../hooks/useTheme.js';
import { useData } from '../../context/DataContext.jsx';

export default function Topbar() {
  const { pathname } = useLocation();
  const { resolved, toggle } = useTheme();
  const { isDemo } = useData();

  const meta = ROUTE_META[pathname] ?? ROUTE_META['/'];

  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">{meta.title}</div>
        <div className="topbar-sub">{meta.sub}</div>
      </div>
      <div className="topbar-actions">
        {isDemo && <span className="pill">Demo data</span>}
        <button
          className="icon-btn"
          onClick={toggle}
          aria-label="Toggle colour theme"
          title="Toggle light / dark"
        >
          {resolved === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <button className="icon-btn" aria-label="Notifications" title="Notifications">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}
