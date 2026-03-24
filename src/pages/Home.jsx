import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/nodus';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  Filler, Tooltip
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const fmt = (n) => {
  const num = Number(n) || 0;
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(num);
};

export default function Home({ user }) {
  const navigate = useNavigate();
  const [resumen, setResumen] = useState(null);
  const [cobros, setCobros] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [r, c, cu] = await Promise.all([
          api.getResumen(),
          api.getCobrosHoy(),
          api.getCuentas(),
        ]);
        setResumen(r);
        setCobros(c.cobros || []);
        setCuentas(cu);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-muted)' }}>Cargando...</p>
      </div>
    );
  }

  const kpis = [
    { label: 'Saldo Total', value: fmt(resumen?.saldo_total), icon: <path d="M21 18v1c0 1.1-.9 2-2 2H5c-1.11 0-2-.9-2-2V5c0-1.1.89-2 2-2h14c1.1 0 2 .9 2 2v1h-9c-1.11 0-2 .9-2 2v8c0 1.1.89 2 2 2h9zm-9-2h10V8H12v8zm4-2.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/> },
    { label: 'Dinero en Calle', value: fmt(resumen?.dinero_en_calle), icon: <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.94s4.18 1.36 4.18 3.85c0 1.89-1.44 2.93-3.12 3.19z"/> },
    { label: 'Ganancia Mes', value: fmt(resumen?.ganancia_proyectada_mes), icon: <path d="M9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4zM5 20h14v2H5z"/> },
    { label: 'En Mora', value: `${resumen?.porcentaje_mora || 0}%`, icon: <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/> },
  ];

  // Chart data for cuentas
  const chartData = {
    labels: cuentas.map(c => c.nombre),
    datasets: [{
      data: cuentas.map(c => Number(c.saldo_actual)),
      borderColor: '#7c3aed',
      backgroundColor: 'rgba(109,40,217,.12)',
      fill: true, tension: 0.45, borderWidth: 2.5,
      pointRadius: 4, pointBackgroundColor: '#7c3aed',
      pointHoverRadius: 6, pointHoverBackgroundColor: '#7c3aed',
      pointHoverBorderColor: '#fff', pointHoverBorderWidth: 2,
    }]
  };
  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11, family: 'Plus Jakarta Sans' } } },
      y: { grid: { color: 'rgba(109,40,217,.06)' }, ticks: { font: { size: 11 }, callback: v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v } }
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Center scroll */}
      <div className="flex-1 overflow-y-auto p-7 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[23px] font-extrabold" style={{ color: 'var(--color-text)' }}>
              Buenos dias, {user || 'Yerlis'}
            </h1>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
              Resumen financiero de hoy
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-[13px]"
                 style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-muted)', width: 200 }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Buscar...
            </div>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-[13px] cursor-pointer"
                 style={{ background: 'linear-gradient(135deg,#a78bfa,#6d28d9)' }}>
              {(user || 'Y')[0]}
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="stagger grid grid-cols-4 gap-3.5">
          {kpis.map((k, i) => (
            <div key={i} className="card card-hover p-4.5 text-center">
              <p className="text-[22px] font-extrabold" style={{ color: 'var(--color-text)' }}>{k.value}</p>
              <div className="w-[42px] h-[42px] rounded-xl mx-auto my-2.5 flex items-center justify-center"
                   style={{ background: 'var(--color-bg)', color: 'var(--color-accent)' }}>
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">{k.icon}</svg>
              </div>
              <p className="text-[11.5px] font-semibold leading-snug" style={{ color: 'var(--color-accent)' }}>{k.label}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="card p-5">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="font-bold text-[15px]" style={{ color: 'var(--color-text)' }}>Saldos por Cuenta</p>
              <p className="label mt-0.5">Distribucion actual</p>
            </div>
          </div>
          <div style={{ height: 190, position: 'relative' }}>
            <Line data={chartData} options={chartOpts} />
          </div>
        </div>

        {/* Transacciones por tipo */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-bold text-[15px]" style={{ color: 'var(--color-text)' }}>Negocios Activos</p>
              <p className="label mt-0.5">Por tipo de negocio</p>
            </div>
            <button className="btn-outline" onClick={() => navigate('/dashboard')}>Ver todo</button>
          </div>
          <div className="flex flex-col gap-1.5">
            {(resumen?.transacciones_por_tipo || []).map((t, i) => (
              <div key={i} className="pay-row" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <div className="w-[34px] h-[34px] rounded-[11px] flex items-center justify-center text-[15px] shrink-0"
                     style={{ background: i === 0 ? '#ede9fe' : i === 1 ? '#fce7f3' : '#e0f2fe' }}>
                  {t.tipo_negocio === 'Prestamo' ? '$' : t.tipo_negocio === 'Venta' ? 'V' : 'A'}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold" style={{ color: 'var(--color-text)' }}>
                    {t.tipo_negocio === 'Prestamo' ? 'Prestamos' : t.tipo_negocio === 'Venta' ? 'Ventas a Credito' : 'Arriendos'}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>{t.cantidad} activos</p>
                </div>
                <span className="text-[13px] font-extrabold" style={{ color: 'var(--color-text)' }}>
                  {fmt(t.total_capital)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="shrink-0 overflow-y-auto p-5 flex flex-col gap-4.5"
           style={{ width: 260, borderLeft: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>

        {/* User */}
        <div className="flex items-center gap-3">
          <div className="w-[46px] h-[46px] rounded-full flex items-center justify-center text-white font-extrabold text-[15px] shrink-0"
               style={{ background: 'linear-gradient(135deg,#a78bfa,#6d28d9)' }}>
            {(user || 'Y')[0]}
          </div>
          <div>
            <p className="font-bold text-[14px]" style={{ color: 'var(--color-text)' }}>{user || 'Yerlis'}</p>
            <p className="text-[11px] font-medium" style={{ color: 'var(--color-accent)' }}>Administradora</p>
          </div>
        </div>

        {/* Balance card */}
        <div className="credit-card">
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div>
              <p className="text-[10px] opacity-60 uppercase tracking-widest">Balance Total</p>
              <p className="text-[22px] font-extrabold mt-0.5">{fmt(resumen?.saldo_total)}</p>
              <p className="text-[10px] opacity-60 mt-0.5">{cuentas.length} cuentas activas</p>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider"
                  style={{ background: 'rgba(255,255,255,.2)' }}>NODUS</span>
          </div>
          <div className="h-0.5 rounded-full mt-4 relative z-10"
               style={{ background: 'linear-gradient(90deg,#f472b6,#a78bfa,#60a5fa)' }} />
        </div>

        {/* Cobros de hoy */}
        <div>
          <p className="font-bold text-[14px] mb-1" style={{ color: 'var(--color-text)' }}>Cobros de Hoy</p>
          <p className="label mb-3">{cobros.length} pendientes</p>
          <div className="flex flex-col gap-1.5">
            {cobros.slice(0, 5).map((c, i) => (
              <div key={i} className="pay-row">
                <div className="w-[36px] h-[36px] rounded-[11px] flex items-center justify-center text-[11px] font-bold shrink-0"
                     style={{ background: '#ede9fe', color: '#6d28d9' }}>
                  {(c.nombre_cliente || '?')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold truncate" style={{ color: 'var(--color-text)' }}>
                    {c.nombre_cliente}
                  </p>
                  <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                    {c.estado_calculado === 'En Mora' ? `${c.dias_mora}d mora` : 'Hoy'}
                  </p>
                </div>
                <span className="text-[13px] font-extrabold" style={{ color: c.dias_mora > 0 ? 'var(--color-danger)' : 'var(--color-text)' }}>
                  {fmt(c.monto_total_con_mora)}
                </span>
              </div>
            ))}
            {cobros.length === 0 && (
              <p className="text-[12px] text-center py-4" style={{ color: 'var(--color-muted)' }}>
                Sin cobros pendientes hoy
              </p>
            )}
          </div>
        </div>

        {/* Clientes en mora */}
        {(resumen?.clientes_en_mora || []).length > 0 && (
          <div>
            <p className="font-bold text-[14px] mb-1" style={{ color: 'var(--color-text)' }}>Clientes en Mora</p>
            <p className="label mb-3">{resumen.clientes_en_mora.length} clientes</p>
            <div className="flex flex-col gap-1.5">
              {resumen.clientes_en_mora.slice(0, 4).map((c, i) => (
                <div key={i} className="pay-row">
                  <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-[11px] font-bold shrink-0"
                       style={{ background: '#fee2e2', color: '#dc2626' }}>
                    {c.nombre[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-[12px] font-bold" style={{ color: 'var(--color-text)' }}>{c.nombre}</p>
                    <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                      {c.cuotas_vencidas} cuotas, max {c.dias_mora_max}d
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
