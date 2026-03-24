import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clearToken, api } from '../api/nodus';

const navItems = [
  {
    id: 'home', path: '/', title: 'Home',
    icon: <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>,
  },
  {
    id: 'dashboard', path: '/dashboard', title: 'Dashboard',
    icon: <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>,
  },
  {
    id: 'clientes', path: '/clientes', title: 'Clientes',
    icon: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>,
  },
  {
    id: 'finanzas', path: '/finanzas', title: 'Finanzas',
    icon: <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>,
  },
];

export default function Sidebar({ onToggleDark, isDark, onLogout }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinForm, setPinForm] = useState({ actual: '', nuevo: '', confirmar: '' });
  const [pinMsg, setPinMsg] = useState('');

  const handleLogout = () => {
    clearToken();
    onLogout();
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    setPinMsg('');
    if (pinForm.nuevo !== pinForm.confirmar) {
      setPinMsg('Los PIN no coinciden');
      return;
    }
    try {
      await api.changePin(pinForm.actual, pinForm.nuevo);
      setPinMsg('PIN actualizado');
      setTimeout(() => { setShowPinModal(false); setPinMsg(''); setPinForm({ actual: '', nuevo: '', confirmar: '' }); }, 1200);
    } catch (err) {
      setPinMsg(err.detail || 'Error al cambiar PIN');
    }
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="sidebar desktop-sidebar flex flex-col items-center py-5 gap-1.5 shrink-0">
        {/* Logo */}
        <div
          className="w-11 h-11 rounded-[14px] flex items-center justify-center mb-4 cursor-pointer"
          style={{ background: 'rgba(255,255,255,.18)' }}
          onClick={() => navigate('/')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
        </div>

        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              className={`nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              title={item.title}
            >
              <svg width="19" height="19" fill="currentColor" viewBox="0 0 24 24">
                {item.icon}
              </svg>
            </button>
          );
        })}

        <div className="flex-1" />

        {/* Change PIN */}
        <button className="nav-btn" title="Cambiar PIN" onClick={() => setShowPinModal(true)}>
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
          </svg>
        </button>

        {/* Dark mode toggle */}
        <div className="flex flex-col items-center gap-1 mb-1">
          <svg width="13" height="13" fill="rgba(255,255,255,.5)" viewBox="0 0 24 24">
            <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1z"/>
          </svg>
          <div className="toggle-track" onClick={onToggleDark}>
            <div className="toggle-knob" />
          </div>
          <svg width="13" height="13" fill="rgba(255,255,255,.5)" viewBox="0 0 24 24">
            <path d="M12 3a9 9 0 109 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/>
          </svg>
        </div>

        {/* Logout */}
        <button className="nav-btn" title="Cerrar sesion" onClick={handleLogout}
                style={{ color: '#f87171' }}>
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
        </button>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                {item.icon}
              </svg>
              <span>{item.title}</span>
            </button>
          );
        })}
        {/* More menu */}
        <button className="mobile-nav-btn" onClick={handleLogout}>
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
          </svg>
          <span>Salir</span>
        </button>
      </nav>

      {/* PIN change modal */}
      {showPinModal && (
        <div className="modal-overlay" onClick={() => setShowPinModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <p className="font-bold text-[16px] mb-4" style={{ color: 'var(--color-text)' }}>Cambiar PIN</p>
            <form onSubmit={handleChangePin} className="flex flex-col gap-3">
              <input className="input-field" type="password" placeholder="PIN actual"
                     value={pinForm.actual} onChange={(e) => setPinForm({...pinForm, actual: e.target.value})} required />
              <input className="input-field" type="password" placeholder="PIN nuevo"
                     value={pinForm.nuevo} onChange={(e) => setPinForm({...pinForm, nuevo: e.target.value})} required />
              <input className="input-field" type="password" placeholder="Confirmar PIN nuevo"
                     value={pinForm.confirmar} onChange={(e) => setPinForm({...pinForm, confirmar: e.target.value})} required />
              {pinMsg && <p className="text-[12px] font-semibold" style={{ color: pinMsg.includes('actualizado') ? 'var(--color-success)' : 'var(--color-danger)' }}>{pinMsg}</p>}
              <div className="flex gap-2 justify-end">
                <button type="button" className="btn-outline" onClick={() => setShowPinModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
