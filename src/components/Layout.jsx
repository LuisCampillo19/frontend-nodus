import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function Layout({ onToggleDark, isDark, user, onLogout }) {
  return (
    <div className="app-layout">
      <Sidebar onToggleDark={onToggleDark} isDark={isDark} onLogout={onLogout} />
      <div className="app-content">
        <Outlet />
      </div>
    </div>
  );
}
