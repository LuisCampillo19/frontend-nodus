import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/nodus';

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n) || 0);

export default function TransaccionDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tx, setTx] = useState(null);
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPago, setShowPago] = useState(false);
  const [showAbono, setShowAbono] = useState(false);
  const [pagoForm, setPagoForm] = useState({ cuota_id: '', cuenta_destino_id: '', monto_real_pagado: '', metodo_pago: 'Transferencia' });
  const [abonoForm, setAbonoForm] = useState({ cuenta_destino_id: '', monto_real_pagado: '', metodo_pago: 'Transferencia', notas: '' });

  const load = async () => {
    setLoading(true);
    try {
      const [t, c] = await Promise.all([api.getTransaccion(id), api.getCuentas()]);
      setTx(t);
      setCuentas(c);
      if (c.length) {
        setPagoForm(f => ({ ...f, cuenta_destino_id: c[0].id }));
        setAbonoForm(f => ({ ...f, cuenta_destino_id: c[0].id }));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handlePago = async (e) => {
    e.preventDefault();
    const cuota = tx.cuotas.find(c => c.id === Number(pagoForm.cuota_id));
    if (!cuota) return alert('Selecciona una cuota');
    try {
      await api.pagarCuota({
        transaccion_id: Number(id),
        cuota_id: Number(pagoForm.cuota_id),
        cuenta_destino_id: Number(pagoForm.cuenta_destino_id),
        monto_real_pagado: Number(pagoForm.monto_real_pagado),
        monto_aplicado_capital: Number(cuota.monto_esperado_capital),
        monto_aplicado_interes: Number(cuota.monto_esperado_interes),
        monto_aplicado_mora: 0,
        metodo_pago: pagoForm.metodo_pago,
      });
      setShowPago(false);
      load();
    } catch (err) { alert(err.detail || JSON.stringify(err)); }
  };

  const handleAbono = async (e) => {
    e.preventDefault();
    try {
      await api.abonoCapital({
        transaccion_id: Number(id),
        cuenta_destino_id: Number(abonoForm.cuenta_destino_id),
        monto_real_pagado: Number(abonoForm.monto_real_pagado),
        metodo_pago: abonoForm.metodo_pago,
        notas: abonoForm.notas,
      });
      setShowAbono(false);
      load();
    } catch (err) { alert(err.detail || JSON.stringify(err)); }
  };

  if (loading || !tx) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm font-semibold" style={{ color: 'var(--color-muted)' }}>Cargando...</p>
      </div>
    );
  }

  const estadoPill = (estado) => {
    switch (estado) {
      case 'Pagada': return <span className="pill pill-green">Pagada</span>;
      case 'Pendiente': return <span className="pill pill-yellow">Pendiente</span>;
      case 'Parcial': return <span className="pill pill-blue">Parcial</span>;
      case 'En Mora': return <span className="pill pill-red">En Mora</span>;
      case 'Anulada': return <span className="pill" style={{ opacity: 0.4 }}>Anulada</span>;
      default: return <span className="pill pill-yellow">{estado}</span>;
    }
  };

  const cuotasPendientes = (tx.cuotas || []).filter(c => c.estado_base === 'Pendiente' || c.estado_base === 'Parcial');

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-7 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="btn-outline" onClick={() => navigate(-1)}>Volver</button>
            <div>
              <h1 className="text-[23px] font-extrabold" style={{ color: 'var(--color-text)' }}>
                {tx.tipo_negocio} - {tx.nombre_cliente}
              </h1>
              <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-muted)' }}>
                Transaccion #{tx.id} -- {new Date(tx.fecha_inicio).toLocaleDateString('es-CO')}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary text-[12px]" onClick={() => { setShowPago(!showPago); setShowAbono(false); }}>
              Registrar Pago
            </button>
            <button className="btn-outline" onClick={() => { setShowAbono(!showAbono); setShowPago(false); }}>
              Abono Capital
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="stagger grid grid-cols-4 gap-3.5">
          <div className="card p-4.5" style={{ background: 'linear-gradient(135deg,#5b21b6,#4338ca)', border: 'none' }}>
            <p className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,.7)' }}>Capital</p>
            <p className="text-[20px] font-extrabold mt-1" style={{ color: '#fff' }}>{fmt(tx.monto_capital)}</p>
          </div>
          <div className="card card-hover p-4.5">
            <p className="text-[12px] font-semibold" style={{ color: 'var(--color-muted)' }}>Pagado</p>
            <p className="text-[20px] font-extrabold mt-1" style={{ color: 'var(--color-success)' }}>{fmt(tx.total_pagado)}</p>
          </div>
          <div className="card card-hover p-4.5">
            <p className="text-[12px] font-semibold" style={{ color: 'var(--color-muted)' }}>Pendiente</p>
            <p className="text-[20px] font-extrabold mt-1" style={{ color: 'var(--color-warning)' }}>{fmt(tx.saldo_pendiente)}</p>
          </div>
          <div className="card card-hover p-4.5">
            <p className="text-[12px] font-semibold" style={{ color: 'var(--color-muted)' }}>Tasa / Cuotas</p>
            <p className="text-[20px] font-extrabold mt-1" style={{ color: 'var(--color-text)' }}>{Number(tx.tasa_interes)}% / {tx.num_cuotas || 0}</p>
          </div>
        </div>

        {/* Payment form */}
        {showPago && (
          <div className="card p-5 animate-fade-up">
            <p className="font-bold text-[15px] mb-4" style={{ color: 'var(--color-text)' }}>Pago a Cuota</p>
            <form onSubmit={handlePago} className="grid grid-cols-2 gap-3">
              <select className="input-field" value={pagoForm.cuota_id}
                      onChange={(e) => {
                        const cuota = tx.cuotas.find(c => c.id === Number(e.target.value));
                        setPagoForm({...pagoForm,
                          cuota_id: e.target.value,
                          monto_real_pagado: cuota ? (Number(cuota.monto_esperado_capital) + Number(cuota.monto_esperado_interes)).toString() : '',
                        });
                      }}>
                <option value="">Seleccionar cuota...</option>
                {cuotasPendientes.map(c => (
                  <option key={c.id} value={c.id}>
                    Cuota {c.numero_cuota} - {fmt(Number(c.monto_esperado_capital) + Number(c.monto_esperado_interes))}
                  </option>
                ))}
              </select>
              <select className="input-field" value={pagoForm.cuenta_destino_id}
                      onChange={(e) => setPagoForm({...pagoForm, cuenta_destino_id: e.target.value})}>
                {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <input className="input-field" type="number" placeholder="Monto pagado" required
                     value={pagoForm.monto_real_pagado}
                     onChange={(e) => setPagoForm({...pagoForm, monto_real_pagado: e.target.value})} />
              <select className="input-field" value={pagoForm.metodo_pago}
                      onChange={(e) => setPagoForm({...pagoForm, metodo_pago: e.target.value})}>
                <option value="Transferencia">Transferencia</option>
                <option value="Efectivo">Efectivo</option>
                <option value="Nequi">Nequi</option>
              </select>
              <div className="col-span-2 flex justify-end">
                <button type="submit" className="btn-primary">Confirmar Pago</button>
              </div>
            </form>
          </div>
        )}

        {showAbono && (
          <div className="card p-5 animate-fade-up">
            <p className="font-bold text-[15px] mb-4" style={{ color: 'var(--color-text)' }}>Abono a Capital</p>
            <form onSubmit={handleAbono} className="grid grid-cols-2 gap-3">
              <select className="input-field" value={abonoForm.cuenta_destino_id}
                      onChange={(e) => setAbonoForm({...abonoForm, cuenta_destino_id: e.target.value})}>
                {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <input className="input-field" type="number" placeholder="Monto del abono" required
                     value={abonoForm.monto_real_pagado}
                     onChange={(e) => setAbonoForm({...abonoForm, monto_real_pagado: e.target.value})} />
              <input className="input-field col-span-2" placeholder="Notas"
                     value={abonoForm.notas} onChange={(e) => setAbonoForm({...abonoForm, notas: e.target.value})} />
              <div className="col-span-2 flex justify-end">
                <button type="submit" className="btn-primary">Confirmar Abono</button>
              </div>
            </form>
          </div>
        )}

        {/* Cuotas table */}
        <div className="card p-5">
          <p className="font-bold text-[15px] mb-4" style={{ color: 'var(--color-text)' }}>Plan de Cuotas</p>
          <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th className="text-left py-2 label">#</th>
                <th className="text-left py-2 label">Capital</th>
                <th className="text-left py-2 label">Interes</th>
                <th className="text-left py-2 label">Total</th>
                <th className="text-left py-2 label">Vencimiento</th>
                <th className="text-left py-2 label">Mora</th>
                <th className="text-right py-2 label">Estado</th>
              </tr>
            </thead>
            <tbody>
              {(tx.cuotas || []).filter(c => c.estado_base !== 'Anulada').map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td className="py-2 font-bold" style={{ color: 'var(--color-text)' }}>{c.numero_cuota}</td>
                  <td style={{ color: 'var(--color-text)' }}>{fmt(c.monto_esperado_capital)}</td>
                  <td style={{ color: 'var(--color-muted)' }}>{fmt(c.monto_esperado_interes)}</td>
                  <td className="font-bold" style={{ color: 'var(--color-text)' }}>
                    {fmt(Number(c.monto_esperado_capital) + Number(c.monto_esperado_interes))}
                  </td>
                  <td style={{ color: 'var(--color-muted)' }}>{new Date(c.fecha_vencimiento).toLocaleDateString('es-CO')}</td>
                  <td>
                    {c.dias_mora > 0 && (
                      <span className="text-[11px] font-bold" style={{ color: 'var(--color-danger)' }}>
                        {c.dias_mora}d (+{fmt(c.penalizacion)})
                      </span>
                    )}
                  </td>
                  <td className="text-right">{estadoPill(c.estado_calculado || c.estado_base)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagos history */}
        {(tx.pagos || []).length > 0 && (
          <div className="card p-5">
            <p className="font-bold text-[15px] mb-4" style={{ color: 'var(--color-text)' }}>Historial de Pagos</p>
            <div className="flex flex-col gap-1.5">
              {tx.pagos.map((p) => (
                <div key={p.id} className="pay-row" style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <div className="w-[36px] h-[36px] rounded-[11px] flex items-center justify-center text-[12px] font-bold shrink-0"
                       style={{ background: '#d1fae5', color: '#059669' }}>$</div>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold" style={{ color: 'var(--color-text)' }}>
                      {p.metodo_pago} - {p.nombre_cuenta}
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                      {new Date(p.fecha_pago).toLocaleDateString('es-CO')}
                      {p.notas ? ` -- ${p.notas}` : ''}
                    </p>
                  </div>
                  <span className="text-[13px] font-extrabold" style={{ color: 'var(--color-success)' }}>
                    +{fmt(p.monto_real_pagado)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
