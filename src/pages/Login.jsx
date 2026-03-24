import { useState } from 'react';
import { api, setToken } from '../api/nodus';

export default function Login({ onLogin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.login(pin);
      setToken(data.access_token);
      onLogin(data.user);
    } catch (err) {
      setError(err.detail || 'PIN incorrecto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
      <div className="card p-10 w-full max-w-sm animate-fade-up">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #5b21b6, #4338ca)' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/>
              <path d="M2 17l10 5 10-5"/>
              <path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-center mb-1" style={{ color: 'var(--color-text)' }}>
          Nodus
        </h1>
        <p className="text-center text-sm mb-8" style={{ color: 'var(--color-muted)' }}>
          Sistema de Gestion Financiera
        </p>

        <form onSubmit={handleSubmit}>
          <label className="label block mb-2">PIN de acceso</label>
          <input
            type="password"
            className="input-field mb-4"
            placeholder="Ingresa tu PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoFocus
          />

          {error && (
            <p className="text-sm mb-4 font-semibold" style={{ color: 'var(--color-danger)' }}>{error}</p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
