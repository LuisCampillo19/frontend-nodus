import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated, clearToken } from './api/nodus';

import Login from './pages/Login';
import Layout from './components/Layout';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/Clientes';
import Finanzas from './pages/Finanzas';
import TransaccionDetalle from './pages/TransaccionDetalle';
import NuevaTransaccion from './pages/NuevaTransaccion';

export default function App() {
  const [user, setUser] = useState(isAuthenticated() ? 'Yerlis' : null);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('nodus_theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      return true;
    }
    return false;
  });

  const handleLogin = (name) => {
    setUser(name);
  };

  const handleLogout = () => {
    clearToken();
    setUser(null);
  };

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('nodus_theme', next ? 'dark' : 'light');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout onToggleDark={toggleDark} isDark={isDark} user={user} onLogout={handleLogout} />}>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/finanzas" element={<Finanzas />} />
          <Route path="/transaccion/:id" element={<TransaccionDetalle />} />
          <Route path="/nueva-transaccion" element={<NuevaTransaccion />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
