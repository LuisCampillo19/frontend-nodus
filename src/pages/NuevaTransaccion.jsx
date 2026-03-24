import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/nodus';

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n) || 0);

export default function NuevaTransaccion() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedClientId = searchParams.get('cliente_id');

  const [clientes, setClientes] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState(null);

  const [form, setForm] = useState({
    cliente_id: preselectedClientId || '',
    tipo_negocio: 'Prestamo',
    monto_capital: '',
    tasa_interes: '20',
    tipo_interes: 'Simple',
    num_cuotas: '3',
    frecuencia_pago: 'Quincenal',
    descripcion: '',
    cuenta_origen_id: '',
    fecha_inicio: '',
    notas: '',
  });
  const [tasaManual, setTasaManual] = useState(false);

  // Auto-suggest interest rate based on loan duration
  // 20% per month. Quincenal = 2 cuotas/mes, Semanal = 4 cuotas/mes, Mensual = 1 cuota/mes
  useEffect(() => {
    if (tasaManual) return; // User overrode the rate manually
    const cuotas = Number(form.num_cuotas);
    if (cuotas <= 0) return;

    let meses = 0;
    if (form.frecuencia_pago === 'Quincenal') {
      meses = Math.ceil(cuotas / 2);
    } else if (form.frecuencia_pago === 'Semanal') {
      meses = Math.ceil(cuotas / 4);
    } else if (form.frecuencia_pago === 'Mensual') {
      meses = cuotas;
    } else { // Diario
      meses = Math.ceil(cuotas / 30);
    }
    if (meses < 1) meses = 1;
    const tasaSugerida = 20 * meses;
    setForm(f => ({ ...f, tasa_interes: String(tasaSugerida) }));
  }, [form.num_cuotas, form.frecuencia_pago]);

  useEffect(() => { 
    async function load() {
      try {
        const [cl, cu] = await Promise.all([api.getClientes(), api.getCuentas()]);
        setClientes(cl);
        setCuentas(cu);
        if (preselectedClientId) setForm(f => ({ ...f, cliente_id: preselectedClientId }));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  // Preview calculation
  useEffect(() => {
    const capital = Number(form.monto_capital);
    const tasa = Number(form.tasa_interes);
    const cuotas = Number(form.num_cuotas);
    if (capital > 0 && tasa >= 0 && cuotas > 0) {
      const interesTotal = capital * (tasa / 100);
      const total = capital + interesTotal;
      const cuotaTotal = Math.round(total / cuotas);
      const cuotaCapital = Math.round(capital / cuotas);
      const cuotaInteres = cuotaTotal - cuotaCapital;

      // Generate date previews
      const fechas = [];
      let d = form.fecha_inicio ? new Date(form.fecha_inicio + 'T12:00:00') : null;
      if (d) {
        for (let i = 0; i < cuotas; i++) {
          if (form.frecuencia_pago === 'Quincenal') {
            // Cada 15 dias a partir de la fecha del primer pago
            const next = new Date(d);
            next.setDate(next.getDate() + (i * 15));
            fechas.push(next);
          } else if (form.frecuencia_pago === 'Mensual') {
            const next = new Date(d);
            next.setMonth(next.getMonth() + i);
            fechas.push(next);
          } else if (form.frecuencia_pago === 'Semanal') {
            const next = new Date(d);
            next.setDate(next.getDate() + (i * 7));
            fechas.push(next);
          } else {
            const next = new Date(d);
            next.setDate(next.getDate() + i);
            fechas.push(next);
          }
        }
      }

      setPreview({
        interesTotal,
        total,
        cuotaTotal,
        cuotaCapital,
        cuotaInteres,
        fechas,
        cuotasList: Array.from({ length: cuotas }, (_, i) => ({
          num: i + 1,
          capital: i === cuotas - 1 ? capital - cuotaCapital * (cuotas - 1) : cuotaCapital,
          interes: i === cuotas - 1 ? interesTotal - cuotaInteres * (cuotas - 1) : cuotaInteres,
          total: i === cuotas - 1 ? total - cuotaTotal * (cuotas - 1) : cuotaTotal,
          fecha: fechas[i] || null,
        })),
      });
    } else {
      setPreview(null);
    }
  }, [form.monto_capital, form.tasa_interes, form.num_cuotas, form.fecha_inicio, form.frecuencia_pago]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cliente_id) return alert('Selecciona un cliente');
    if (!form.monto_capital) return alert('Ingresa el monto del capital');
    if (!form.fecha_inicio) return alert('Selecciona la fecha del primer pago');

    setSubmitting(true);
    try {
      const payload = {
        cliente_id: Number(form.cliente_id),
        tipo_negocio: form.tipo_negocio,
        monto_capital: Number(form.monto_capital),
        tasa_interes: Number(form.tasa_interes),
        tipo_interes: form.tipo_interes,
        num_cuotas: Number(form.num_cuotas),
        frecuencia_pago: form.frecuencia_pago,
        descripcion: form.descripcion || null,
        cuenta_origen_id: form.cuenta_origen_id ? Number(form.cuenta_origen_id) : null,
        fecha_inicio: form.fecha_inicio,
        notas: form.notas || null,
      };
      const result = await api.createTransaccion(payload);
      navigate(`/transaccion/${result.id}`);
    } catch (err) {
      alert(err.detail || 'Error al crear la transaccion');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-muted)' }}>Cargando...</p>
      </div>
    );
  }

  const clienteSeleccionado = clientes.find(c => c.id === Number(form.cliente_id));

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-7 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button className="btn-outline" onClick={() => navigate(-1)}>Volver</button>
          <div>
            <h1 className="text-[23px] font-extrabold" style={{ color: 'var(--color-text)' }}>Nueva Transaccion</h1>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-muted)' }}>Registrar prestamo, venta o arriendo</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="card p-5">
            <p className="font-bold text-[15px] mb-4" style={{ color: 'var(--color-text)' }}>Datos del Negocio</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Cliente */}
              <div className="col-span-2">
                <label className="label block mb-1.5">Cliente</label>
                <select className="input-field" value={form.cliente_id}
                        onChange={(e) => setForm({...form, cliente_id: e.target.value})} required>
                  <option value="">-- Seleccionar cliente --</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}{c.alias ? ` (${c.alias})` : ''}</option>
                  ))}
                </select>
              </div>

              {/* Tipo */}
              <div>
                <label className="label block mb-1.5">Tipo de Negocio</label>
                <select className="input-field" value={form.tipo_negocio}
                        onChange={(e) => setForm({...form, tipo_negocio: e.target.value})}>
                  <option value="Prestamo">Prestamo</option>
                  <option value="Venta">Venta a Credito</option>
                  <option value="Arriendo">Arriendo</option>
                </select>
              </div>

              {/* Capital */}
              <div>
                <label className="label block mb-1.5">Capital Prestado</label>
                <input className="input-field" type="number" placeholder="500000" required
                       value={form.monto_capital}
                       onChange={(e) => setForm({...form, monto_capital: e.target.value})} />
              </div>

              {/* Tasa */}
              <div>
                <label className="label block mb-1.5">
                  Tasa de Interes (% total)
                  {tasaManual ? (
                    <span style={{ color: 'var(--color-warning)', marginLeft: 6, fontSize: 9, cursor: 'pointer' }}
                          onClick={() => setTasaManual(false)}> manual - restaurar auto</span>
                  ) : (
                    <span style={{ color: 'var(--color-success)', marginLeft: 6, fontSize: 9 }}> auto</span>
                  )}
                </label>
                <input className="input-field" type="number" step="0.1" placeholder="20"
                       style={tasaManual ? { borderColor: 'var(--color-warning)' } : {}}
                       value={form.tasa_interes}
                       onChange={(e) => { setTasaManual(true); setForm({...form, tasa_interes: e.target.value}); }} />
              </div>

              {/* Cuotas */}
              <div>
                <label className="label block mb-1.5">Numero de Cuotas</label>
                <input className="input-field" type="number" min="1" placeholder="3"
                       value={form.num_cuotas}
                       onChange={(e) => setForm({...form, num_cuotas: e.target.value})} />
              </div>

              {/* Frecuencia */}
              <div>
                <label className="label block mb-1.5">Frecuencia de Pago</label>
                <select className="input-field" value={form.frecuencia_pago}
                        onChange={(e) => setForm({...form, frecuencia_pago: e.target.value})}>
                  <option value="Quincenal">Quincenal (cada 15 dias)</option>
                  <option value="Mensual">Mensual</option>
                  <option value="Semanal">Semanal</option>
                  <option value="Diario">Diario</option>
                </select>
              </div>

              {/* Fecha primer pago */}
              <div>
                <label className="label block mb-1.5">Fecha del Primer Pago</label>
                <input className="input-field" type="date" required
                       value={form.fecha_inicio}
                       onChange={(e) => setForm({...form, fecha_inicio: e.target.value})} />
              </div>

              {/* Cuenta origen */}
              <div>
                <label className="label block mb-1.5">Descontar de cuenta (opcional)</label>
                <select className="input-field" value={form.cuenta_origen_id}
                        onChange={(e) => setForm({...form, cuenta_origen_id: e.target.value})}>
                  <option value="">-- No descontar --</option>
                  {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre} ({fmt(c.saldo_actual)})</option>)}
                </select>
              </div>

              {/* Notas */}
              <div className="col-span-2">
                <label className="label block mb-1.5">Notas / Descripcion</label>
                <textarea className="input-field" rows={2} placeholder="Detalles adicionales..."
                          value={form.notas}
                          onChange={(e) => setForm({...form, notas: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-outline" onClick={() => navigate(-1)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Creando...' : 'Crear Transaccion'}
            </button>
          </div>
        </form>
      </div>

      {/* Right panel: preview */}
      <div className="shrink-0 overflow-y-auto p-5 flex flex-col gap-4.5"
           style={{ width: 280, borderLeft: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>

        {clienteSeleccionado && (
          <div className="flex items-center gap-3 mb-2">
            <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-white font-extrabold text-[14px] shrink-0"
                 style={{ background: 'linear-gradient(135deg,#a78bfa,#6d28d9)' }}>
              {clienteSeleccionado.nombre[0]}
            </div>
            <div>
              <p className="font-bold text-[14px]" style={{ color: 'var(--color-text)' }}>{clienteSeleccionado.nombre}</p>
              <p className="text-[11px] font-medium" style={{ color: 'var(--color-accent)' }}>{clienteSeleccionado.alias || 'Sin alias'}</p>
            </div>
          </div>
        )}

        {preview ? (
          <>
            {/* Summary card */}
            <div className="credit-card" style={{ padding: 18 }}>
              <div className="relative z-10">
                <p className="text-[10px] opacity-60 uppercase tracking-widest">Total a Cobrar</p>
                <p className="text-[22px] font-extrabold mt-0.5">{fmt(preview.total)}</p>
                <div className="flex gap-4 mt-2 text-[10px] opacity-75">
                  <div>
                    <p className="opacity-60 uppercase">Capital</p>
                    <p className="font-bold">{fmt(form.monto_capital)}</p>
                  </div>
                  <div>
                    <p className="opacity-60 uppercase">Interes</p>
                    <p className="font-bold">{fmt(preview.interesTotal)}</p>
                  </div>
                </div>
              </div>
              <div className="h-[2px] rounded-full mt-3 relative z-10"
                   style={{ background: 'linear-gradient(90deg,#f472b6,#a78bfa,#60a5fa)' }} />
            </div>

            {/* Installment preview */}
            <div>
              <p className="font-bold text-[14px] mb-1" style={{ color: 'var(--color-text)' }}>Plan de Cuotas</p>
              <p className="label mb-3">{form.num_cuotas} cuotas de {fmt(preview.cuotaTotal)}</p>
              <div className="flex flex-col gap-1.5">
                {preview.cuotasList.map((c) => (
                  <div key={c.num} className="pay-row" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <div className="w-[30px] h-[30px] rounded-[10px] flex items-center justify-center text-[11px] font-bold shrink-0"
                         style={{ background: '#ede9fe', color: '#6d28d9' }}>
                      {c.num}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold" style={{ color: 'var(--color-text)' }}>
                        {fmt(c.total)}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                        {c.fecha ? c.fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Selecciona fecha'}
                      </p>
                    </div>
                    <span className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                      Cap: {fmt(c.capital)}<br/>Int: {fmt(c.interes)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-[12px] text-center" style={{ color: 'var(--color-muted)' }}>
              Ingresa el capital, tasa y cuotas para ver la previsualizacion
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
