import { useState, useEffect } from 'react';
import { api } from '../api/nodus';

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n) || 0);

const categorias = ['Salario', 'Arriendo Recibido', 'Mercado', 'Servicios', 'Transporte', 'Salud', 'Educacion', 'Entretenimiento', 'Otro'];

export default function Finanzas() {
  const [movimientos, setMovimientos] = useState([]);
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filtro, setFiltro] = useState('');
  const [form, setForm] = useState({
    tipo_movimiento: 'Gasto', cuenta_id: '', categoria: 'Mercado',
    descripcion: '', monto: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const params = filtro ? `tipo=${filtro}` : '';
      const [m, c] = await Promise.all([
        api.getFinanzas(params),
        api.getCuentas(),
      ]);
      setMovimientos(m);
      setCuentas(c);
      if (!form.cuenta_id && c.length > 0) setForm(f => ({ ...f, cuenta_id: c[0].id }));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filtro]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createFinanza({
        ...form,
        monto: Number(form.monto),
        cuenta_id: Number(form.cuenta_id),
      });
      setShowForm(false);
      setForm({ tipo_movimiento: 'Gasto', cuenta_id: cuentas[0]?.id || '', categoria: 'Mercado', descripcion: '', monto: '' });
      load();
    } catch (err) { alert(err.detail); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Eliminar este movimiento y revertir el saldo?')) return;
    try {
      await api.deleteFinanza(id);
      load();
    } catch (err) { alert(err.detail); }
  };

  const totalIngresos = movimientos.filter(m => m.tipo_movimiento === 'Ingreso').reduce((s, m) => s + Number(m.monto), 0);
  const totalGastos = movimientos.filter(m => m.tipo_movimiento === 'Gasto').reduce((s, m) => s + Number(m.monto), 0);

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-7 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[23px] font-extrabold" style={{ color: 'var(--color-text)' }}>Finanzas Personales</h1>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-muted)' }}>Ingresos y gastos del hogar</p>
          </div>
          <div className="flex gap-2.5">
            <select className="input-field" style={{ width: 140 }}
                    value={filtro} onChange={(e) => setFiltro(e.target.value)}>
              <option value="">Todos</option>
              <option value="Ingreso">Ingresos</option>
              <option value="Gasto">Gastos</option>
            </select>
            <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancelar' : '+ Registrar'}
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="stagger grid grid-cols-3 gap-3.5">
          <div className="card p-4.5">
            <p className="text-[12px] font-semibold" style={{ color: 'var(--color-muted)' }}>Total Ingresos</p>
            <p className="text-[22px] font-extrabold mt-1" style={{ color: 'var(--color-success)' }}>{fmt(totalIngresos)}</p>
          </div>
          <div className="card p-4.5">
            <p className="text-[12px] font-semibold" style={{ color: 'var(--color-muted)' }}>Total Gastos</p>
            <p className="text-[22px] font-extrabold mt-1" style={{ color: 'var(--color-danger)' }}>{fmt(totalGastos)}</p>
          </div>
          <div className="card p-4.5"
               style={totalIngresos - totalGastos >= 0
                 ? { background: 'linear-gradient(135deg,#5b21b6,#4338ca)', border: 'none' }
                 : {}}>
            <p className="text-[12px] font-semibold" style={{ color: totalIngresos - totalGastos >= 0 ? 'rgba(255,255,255,.7)' : 'var(--color-muted)' }}>
              Balance
            </p>
            <p className="text-[22px] font-extrabold mt-1" style={{ color: totalIngresos - totalGastos >= 0 ? '#fff' : 'var(--color-danger)' }}>
              {fmt(totalIngresos - totalGastos)}
            </p>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="card p-5 animate-fade-up">
            <p className="font-bold text-[15px] mb-4" style={{ color: 'var(--color-text)' }}>Nuevo Movimiento</p>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
              <select className="input-field" value={form.tipo_movimiento}
                      onChange={(e) => setForm({...form, tipo_movimiento: e.target.value})}>
                <option value="Ingreso">Ingreso</option>
                <option value="Gasto">Gasto</option>
              </select>
              <select className="input-field" value={form.cuenta_id}
                      onChange={(e) => setForm({...form, cuenta_id: e.target.value})}>
                {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
              <select className="input-field" value={form.categoria}
                      onChange={(e) => setForm({...form, categoria: e.target.value})}>
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <input className="input-field" type="number" placeholder="Monto *" required
                     value={form.monto} onChange={(e) => setForm({...form, monto: e.target.value})} />
              <input className="input-field col-span-2" placeholder="Descripcion"
                     value={form.descripcion} onChange={(e) => setForm({...form, descripcion: e.target.value})} />
              <div className="col-span-2 flex justify-end">
                <button type="submit" className="btn-primary">Registrar</button>
              </div>
            </form>
          </div>
        )}

        {/* Movements list */}
        <div className="card p-5">
          <div className="flex flex-col gap-1.5">
            {movimientos.map((m) => (
              <div key={m.id} className="pay-row" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <div className="w-[36px] h-[36px] rounded-[11px] flex items-center justify-center text-[12px] font-bold shrink-0"
                     style={{ background: m.tipo_movimiento === 'Ingreso' ? '#d1fae5' : '#fee2e2',
                              color: m.tipo_movimiento === 'Ingreso' ? '#059669' : '#dc2626' }}>
                  {m.tipo_movimiento === 'Ingreso' ? '+' : '-'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: 'var(--color-text)' }}>
                    {m.descripcion || m.categoria}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--color-muted)' }}>
                    {m.categoria} -- {m.nombre_cuenta} -- {new Date(m.fecha).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <span className="text-[13px] font-extrabold mr-2"
                      style={{ color: m.tipo_movimiento === 'Ingreso' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {m.tipo_movimiento === 'Ingreso' ? '+' : '-'}{fmt(m.monto)}
                </span>
                <button className="text-[11px] cursor-pointer" style={{ color: 'var(--color-muted)', background: 'none', border: 'none' }}
                        onClick={() => handleDelete(m.id)} title="Eliminar">
                  <svg width="14" height="14" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                </button>
              </div>
            ))}
            {!loading && movimientos.length === 0 && (
              <p className="text-center py-8 text-[13px]" style={{ color: 'var(--color-muted)' }}>Sin movimientos registrados</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
