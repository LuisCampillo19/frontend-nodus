import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/nodus';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Filler, Tooltip, Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Filler, Tooltip, Legend);

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n) || 0);

export default function Dashboard() {
  const navigate = useNavigate();
  const [resumen, setResumen] = useState(null);
  const [transacciones, setTransacciones] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [r, t, c] = await Promise.all([
          api.getResumen(),
          api.getTransacciones(),
          api.getCuentas(),
        ]);
        setResumen(r);
        setTransacciones(t);
        setCuentas(c);
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

  // Data calculations
  const saldoTotal = Number(resumen?.saldo_total) || 0;
  const dineroEnCalle = Number(resumen?.dinero_en_calle) || 0;
  const gananciaProyectada = Number(resumen?.ganancia_proyectada_mes) || 0;
  const moraPercent = Number(resumen?.porcentaje_mora) || 0;
  const clientesMora = resumen?.clientes_en_mora || [];
  const txTipos = resumen?.transacciones_por_tipo || [];
  const totalCapital = txTipos.reduce((s, t) => s + Number(t.total_capital), 0);

  // Transactions by status
  const activas = transacciones.filter(t => t.estado === 'Activo');
  const saldadas = transacciones.filter(t => t.estado === 'Saldado');

  // Capital recaudado vs pendiente
  const totalSaldoPendiente = activas.reduce((s, t) => s + Number(t.saldo_pendiente || 0), 0);
  const capitalPrestado = activas.reduce((s, t) => s + Number(t.monto_capital || 0), 0);
  const recaudado = capitalPrestado > 0 ? capitalPrestado - totalSaldoPendiente : 0;
  const pctRecaudado = capitalPrestado > 0 ? Math.round((recaudado / capitalPrestado) * 100) : 0;

  // Doughnut chart data
  const doughnutData = {
    labels: txTipos.map(t => t.tipo_negocio === 'Prestamo' ? 'Prestamos' : t.tipo_negocio === 'Venta' ? 'Ventas' : 'Arriendos'),
    datasets: [{
      data: txTipos.map(t => Number(t.total_capital)),
      backgroundColor: ['#7c3aed', '#06b6d4', '#ec4899', '#f59e0b'],
      borderWidth: 0,
      hoverOffset: 8,
    }],
  };

  // Bar chart: capital por cuenta
  const barData = {
    labels: cuentas.map(c => c.nombre),
    datasets: [{
      label: 'Saldo',
      data: cuentas.map(c => Number(c.saldo_actual)),
      backgroundColor: cuentas.map((_, i) => ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b'][i] || '#7c3aed'),
      borderRadius: 8,
      borderSkipped: false,
      barThickness: 28,
    }],
  };

  const barOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => fmt(ctx.raw) } } },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 10, weight: 600 } } },
      y: { display: false },
    },
  };

  const doughnutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${fmt(ctx.raw)}` } },
    },
  };

  const estadoPill = (estado) => {
    switch (estado) {
      case 'Activo': return <span className="pill pill-green">Activo</span>;
      case 'Saldado': return <span className="pill pill-blue">Saldado</span>;
      case 'Castigado': return <span className="pill pill-red">Castigado</span>;
      default: return <span className="pill pill-yellow">{estado}</span>;
    }
  };

  return (
    <div className="overflow-y-auto h-full p-7 flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[23px] font-extrabold" style={{ color: 'var(--color-text)' }}>Dashboard</h1>
          <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-muted)' }}>Resumen financiero en tiempo real</p>
        </div>
        <button className="btn-primary text-[12px]" onClick={() => navigate('/nueva-transaccion')}>
          + Nueva Transaccion
        </button>
      </div>

      {/* KPI Cards */}
      <div className="stagger grid grid-cols-4 gap-3.5">
        {/* Saldo Total - Hero */}
        <div className="card p-5" style={{ background: 'linear-gradient(135deg,#5b21b6,#4338ca)', border: 'none', boxShadow: '0 8px 28px rgba(91,33,182,.3)' }}>
          <p className="text-[11px] font-semibold" style={{ color: 'rgba(255,255,255,.6)' }}>Saldo Total</p>
          <p className="text-[26px] font-extrabold mt-1" style={{ color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{fmt(saldoTotal)}</p>
          <div className="flex items-center gap-1.5 mt-2">
            <svg width="14" height="14" fill="#34d399" viewBox="0 0 24 24"><path d="M7 14l5-5 5 5z"/></svg>
            <span className="text-[10px] font-bold" style={{ color: '#34d399' }}>{cuentas.length} cuentas activas</span>
          </div>
        </div>

        {/* Dinero en Calle */}
        <div className="card card-hover p-5">
          <div className="flex justify-between items-start">
            <p className="text-[11px] font-semibold" style={{ color: 'var(--color-muted)' }}>Dinero en Calle</p>
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background: '#fef3c7' }}>
              <svg width="16" height="16" fill="#d97706" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.94s4.18 1.36 4.18 3.85c0 1.89-1.44 2.98-3.12 3.19z"/></svg>
            </div>
          </div>
          <p className="text-[22px] font-extrabold mt-1" style={{ color: 'var(--color-text)', fontVariantNumeric: 'tabular-nums' }}>{fmt(dineroEnCalle)}</p>
          <p className="text-[10px] mt-1.5 font-semibold" style={{ color: 'var(--color-warning)' }}>{activas.length} prestamos activos</p>
        </div>

        {/* Ganancia Proyectada */}
        <div className="card card-hover p-5">
          <div className="flex justify-between items-start">
            <p className="text-[11px] font-semibold" style={{ color: 'var(--color-muted)' }}>Ganancia Proyectada</p>
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background: '#d1fae5' }}>
              <svg width="16" height="16" fill="#059669" viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>
            </div>
          </div>
          <p className="text-[22px] font-extrabold mt-1" style={{ color: 'var(--color-success)', fontVariantNumeric: 'tabular-nums' }}>{fmt(gananciaProyectada)}</p>
          <p className="text-[10px] mt-1.5 font-semibold" style={{ color: 'var(--color-muted)' }}>Interes este mes</p>
        </div>

        {/* Mora */}
        <div className="card card-hover p-5">
          <div className="flex justify-between items-start">
            <p className="text-[11px] font-semibold" style={{ color: 'var(--color-muted)' }}>Mora</p>
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background: moraPercent > 0 ? '#fee2e2' : '#d1fae5' }}>
              <svg width="16" height="16" fill={moraPercent > 0 ? '#ef4444' : '#059669'} viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            </div>
          </div>
          <p className="text-[22px] font-extrabold mt-1" style={{ color: moraPercent > 0 ? 'var(--color-danger)' : 'var(--color-success)', fontVariantNumeric: 'tabular-nums' }}>{moraPercent}%</p>
          <p className="text-[10px] mt-1.5 font-semibold" style={{ color: moraPercent > 0 ? 'var(--color-danger)' : 'var(--color-muted)' }}>{clientesMora.length} clientes en mora</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Doughnut: Composicion */}
        <div className="card p-5">
          <p className="font-bold text-[15px]" style={{ color: 'var(--color-text)' }}>Composicion del Capital</p>
          <p className="label mt-0.5 mb-3">Distribucion por tipo de negocio</p>
          <div style={{ height: 180, position: 'relative' }}>
            {txTipos.length > 0 ? (
              <>
                <Doughnut data={doughnutData} options={doughnutOpts} />
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[10px] font-semibold" style={{ color: 'var(--color-muted)' }}>Total</p>
                  <p className="text-[14px] font-extrabold" style={{ color: 'var(--color-text)' }}>{fmt(totalCapital)}</p>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-[12px]" style={{ color: 'var(--color-muted)' }}>Sin datos</p>
              </div>
            )}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3 justify-center">
            {txTipos.map((t, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: ['#7c3aed', '#06b6d4', '#ec4899', '#f59e0b'][i] }} />
                <span className="text-[10px] font-semibold" style={{ color: 'var(--color-muted)' }}>
                  {t.tipo_negocio} ({t.cantidad})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar: Saldos por cuenta */}
        <div className="card p-5">
          <p className="font-bold text-[15px]" style={{ color: 'var(--color-text)' }}>Cuentas</p>
          <p className="label mt-0.5 mb-3">Saldo por cuenta</p>
          <div style={{ height: 180 }}>
            {cuentas.length > 0 ? (
              <Bar data={barData} options={barOpts} />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-[12px]" style={{ color: 'var(--color-muted)' }}>Sin cuentas</p>
              </div>
            )}
          </div>
          {/* Account totals */}
          <div className="flex flex-col gap-1.5 mt-3">
            {cuentas.map((c, i) => (
              <div key={i} className="flex justify-between items-center text-[11px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b'][i] }} />
                  <span style={{ color: 'var(--color-muted)' }}>{c.nombre}</span>
                </div>
                <span className="font-bold" style={{ color: 'var(--color-text)' }}>{fmt(c.saldo_actual)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Progress: Recaudo */}
        <div className="card p-5 flex flex-col">
          <p className="font-bold text-[15px]" style={{ color: 'var(--color-text)' }}>Recaudo</p>
          <p className="label mt-0.5 mb-4">Progreso de cobro activo</p>

          {/* Big circle gauge */}
          <div className="flex items-center justify-center" style={{ flex: 1, minHeight: 140 }}>
            <div className="relative" style={{ width: 140, height: 140 }}>
              <svg width="140" height="140" viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="70" cy="70" r="58" fill="none" stroke="var(--color-border)" strokeWidth="10" />
                <circle cx="70" cy="70" r="58" fill="none" stroke="#7c3aed" strokeWidth="10"
                  strokeDasharray={`${(pctRecaudado / 100) * 364.4} ${364.4 - (pctRecaudado / 100) * 364.4}`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-[28px] font-extrabold" style={{ color: 'var(--color-accent)' }}>{pctRecaudado}%</p>
                <p className="text-[10px] font-semibold" style={{ color: 'var(--color-muted)' }}>cobrado</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-3">
            <div className="flex justify-between text-[11px]">
              <span style={{ color: 'var(--color-muted)' }}>Recaudado</span>
              <span className="font-bold" style={{ color: 'var(--color-success)' }}>{fmt(recaudado)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span style={{ color: 'var(--color-muted)' }}>Pendiente</span>
              <span className="font-bold" style={{ color: 'var(--color-warning)' }}>{fmt(totalSaldoPendiente)}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span style={{ color: 'var(--color-muted)' }}>Capital prestado</span>
              <span className="font-bold" style={{ color: 'var(--color-text)' }}>{fmt(capitalPrestado)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions list */}
      <div className="card p-5">
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="font-bold text-[15px]" style={{ color: 'var(--color-text)' }}>Transacciones Recientes</p>
            <p className="label mt-0.5">{activas.length} activas, {saldadas.length} saldadas</p>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          {transacciones.slice(0, 8).map((t) => {
            const progress = Number(t.monto_capital) > 0
              ? Math.round(((Number(t.monto_capital) - Number(t.saldo_pendiente || 0)) / Number(t.monto_capital)) * 100)
              : 0;
            return (
              <div key={t.id} className="pay-row cursor-pointer card-hover"
                   style={{ borderBottom: '1px solid var(--color-border)', borderRadius: 12, padding: '12px 14px' }}
                   onClick={() => navigate(`/transaccion/${t.id}`)}>
                <div className="w-[40px] h-[40px] rounded-full flex items-center justify-center text-white text-[13px] font-bold shrink-0"
                     style={{ background: t.tipo_negocio === 'Prestamo' ? '#7c3aed' : t.tipo_negocio === 'Venta' ? '#06b6d4' : '#ec4899' }}>
                  {(t.nombre_cliente || '?')[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <p className="text-[13px] font-bold truncate" style={{ color: 'var(--color-text)' }}>{t.nombre_cliente}</p>
                    <span className="text-[13px] font-extrabold" style={{ color: 'var(--color-text)' }}>{fmt(t.monto_capital)}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold" style={{ color: 'var(--color-muted)' }}>{t.tipo_negocio}</span>
                      <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>{Number(t.tasa_interes)}%</span>
                      {estadoPill(t.estado)}
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: Number(t.saldo_pendiente) > 0 ? 'var(--color-warning)' : 'var(--color-success)' }}>
                      Saldo: {fmt(t.saldo_pendiente)}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-1.5 relative" style={{ height: 4, borderRadius: 99, background: 'var(--color-border)' }}>
                    <div style={{ height: '100%', borderRadius: 99, width: `${progress}%`, background: progress >= 100 ? '#059669' : '#7c3aed', transition: 'width .3s' }} />
                  </div>
                </div>
              </div>
            );
          })}
          {transacciones.length === 0 && (
            <p className="text-center py-8 text-[13px]" style={{ color: 'var(--color-muted)' }}>Sin transacciones registradas</p>
          )}
        </div>
      </div>
    </div>
  );
}
