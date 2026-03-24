import { useState, useEffect } from 'react';
import { api } from '../api/nodus';

const fmt = (n) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n) || 0);

const calificacionColors = {
  Excelente: 'pill-green', Bueno: 'pill-blue', Regular: 'pill-yellow', Moroso: 'pill-red',
};

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ nombre: '', telefono: '', alias: '', cedula: '', direccion: '', notas: '', calificacion: 'Bueno' });
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = async (q = '') => {
    setLoading(true);
    try {
      const data = await api.getClientes(q);
      setClientes(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    load(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createCliente(form);
      setShowForm(false);
      setForm({ nombre: '', telefono: '', alias: '', cedula: '', direccion: '', notas: '', calificacion: 'Bueno' });
      load(search);
    } catch (err) { alert(err.detail); }
  };

  const handleSelect = async (c) => {
    setSelected(c.id);
    try {
      const data = await api.getCliente(c.id);
      setDetail(data);
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-7 flex flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[23px] font-extrabold" style={{ color: 'var(--color-text)' }}>Clientes</h1>
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--color-muted)' }}>{clientes.length} clientes activos</p>
          </div>
          <div className="flex gap-2.5">
            <input
              className="input-field"
              style={{ width: 220 }}
              placeholder="Buscar por nombre, alias, telefono..."
              value={search}
              onChange={handleSearch}
            />
            <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancelar' : '+ Nuevo Cliente'}
            </button>
          </div>
        </div>

        {/* New client form */}
        {showForm && (
          <div className="card p-5 animate-fade-up">
            <p className="font-bold text-[15px] mb-4" style={{ color: 'var(--color-text)' }}>Nuevo Cliente</p>
            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
              <input className="input-field" placeholder="Nombre completo *" required
                     value={form.nombre} onChange={(e) => setForm({...form, nombre: e.target.value})} />
              <input className="input-field" placeholder="Telefono"
                     value={form.telefono} onChange={(e) => setForm({...form, telefono: e.target.value})} />
              <input className="input-field" placeholder="Alias"
                     value={form.alias} onChange={(e) => setForm({...form, alias: e.target.value})} />
              <input className="input-field" placeholder="Cedula"
                     value={form.cedula} onChange={(e) => setForm({...form, cedula: e.target.value})} />
              <input className="input-field" placeholder="Direccion"
                     value={form.direccion} onChange={(e) => setForm({...form, direccion: e.target.value})} />
              <select className="input-field" value={form.calificacion}
                      onChange={(e) => setForm({...form, calificacion: e.target.value})}>
                <option value="Excelente">Excelente</option>
                <option value="Bueno">Bueno</option>
                <option value="Regular">Regular</option>
                <option value="Moroso">Moroso</option>
              </select>
              <textarea className="input-field col-span-2" placeholder="Notas" rows={2}
                        value={form.notas} onChange={(e) => setForm({...form, notas: e.target.value})} />
              <div className="col-span-2 flex justify-end">
                <button type="submit" className="btn-primary">Guardar Cliente</button>
              </div>
            </form>
          </div>
        )}

        {/* Client list */}
        <div className="card p-5">
          <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                <th className="text-left py-2.5 font-semibold label">Cliente</th>
                <th className="text-left py-2.5 font-semibold label">Telefono</th>
                <th className="text-left py-2.5 font-semibold label">Alias</th>
                <th className="text-right py-2.5 font-semibold label">Calificacion</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c.id} className={`cursor-pointer hover:opacity-80 ${selected === c.id ? 'opacity-100' : ''}`}
                    style={{ borderBottom: '1px solid var(--color-border)', background: selected === c.id ? 'var(--color-bg)' : 'transparent' }}
                    onClick={() => handleSelect(c)}>
                  <td className="py-2.5 flex items-center gap-2">
                    <div className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                         style={{ background: '#7c3aed' }}>
                      {c.nombre[0]}
                    </div>
                    <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{c.nombre}</span>
                  </td>
                  <td style={{ color: 'var(--color-muted)' }}>{c.telefono || '-'}</td>
                  <td style={{ color: 'var(--color-muted)' }}>{c.alias || '-'}</td>
                  <td className="text-right">
                    <span className={`pill ${calificacionColors[c.calificacion] || 'pill-blue'}`}>
                      {c.calificacion}
                    </span>
                  </td>
                </tr>
              ))}
              {!loading && clientes.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8" style={{ color: 'var(--color-muted)' }}>Sin clientes</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right panel: detail */}
      <div className="shrink-0 overflow-y-auto p-5 flex flex-col gap-4.5"
           style={{ width: 260, borderLeft: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
        {detail ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-[46px] h-[46px] rounded-full flex items-center justify-center text-white font-extrabold text-[15px] shrink-0"
                   style={{ background: 'linear-gradient(135deg,#a78bfa,#6d28d9)' }}>
                {detail.nombre[0]}
              </div>
              <div>
                <p className="font-bold text-[14px]" style={{ color: 'var(--color-text)' }}>{detail.nombre}</p>
                <p className="text-[11px] font-medium" style={{ color: 'var(--color-accent)' }}>{detail.alias || 'Sin alias'}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 text-[12px]">
              {detail.telefono && <p><span style={{ color: 'var(--color-muted)' }}>Tel:</span> <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{detail.telefono}</span></p>}
              {detail.cedula && <p><span style={{ color: 'var(--color-muted)' }}>Cedula:</span> <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{detail.cedula}</span></p>}
              {detail.direccion && <p><span style={{ color: 'var(--color-muted)' }}>Dir:</span> <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{detail.direccion}</span></p>}
              {detail.notas && <p><span style={{ color: 'var(--color-muted)' }}>Notas:</span> <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{detail.notas}</span></p>}
            </div>

            {(detail.transacciones_activas || []).length > 0 && (
              <div>
                <p className="font-bold text-[14px] mb-1" style={{ color: 'var(--color-text)' }}>Deudas Activas</p>
                <p className="label mb-3">{detail.transacciones_activas.length} transacciones</p>
                <div className="flex flex-col gap-1.5">
                  {detail.transacciones_activas.map((t) => (
                    <div key={t.id} className="pay-row">
                      <div className="w-[34px] h-[34px] rounded-[10px] flex items-center justify-center text-[12px] font-bold shrink-0"
                           style={{ background: '#ede9fe', color: '#6d28d9' }}>
                        {t.tipo_negocio[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-[12px] font-bold" style={{ color: 'var(--color-text)' }}>{t.tipo_negocio}</p>
                        <p className="text-[10px]" style={{ color: 'var(--color-muted)' }}>
                          {new Date(t.fecha_inicio).toLocaleDateString('es-CO')}
                        </p>
                      </div>
                      <span className="text-[12px] font-extrabold" style={{ color: 'var(--color-text)' }}>
                        {fmt(t.monto_capital)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2 mt-2">
              <button className="btn-primary text-[12px] w-full"
                      onClick={() => { window.location.href = `/nueva-transaccion?cliente_id=${detail.id}`; }}>
                Prestar a {detail.nombre.split(' ')[0]}
              </button>
              <button className="btn-outline text-[11px] w-full"
                      style={{ color: '#ef4444', borderColor: '#fca5a5' }}
                      onClick={() => setDeleteConfirm(detail)}>
                Eliminar Cliente
              </button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-[12px] text-center" style={{ color: 'var(--color-muted)' }}>
              Selecciona un cliente para ver su detalle
            </p>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <p className="font-bold text-[16px] mb-2" style={{ color: 'var(--color-text)' }}>Eliminar Cliente</p>
            <p className="text-[13px] mb-1" style={{ color: 'var(--color-muted)' }}>
              Estas segura de eliminar a <strong style={{ color: 'var(--color-text)' }}>{deleteConfirm.nombre}</strong>?
            </p>
            {(deleteConfirm.transacciones_activas || []).length > 0 && (
              <p className="text-[12px] font-semibold mt-1 mb-3" style={{ color: 'var(--color-danger)' }}>
                Este cliente tiene {deleteConfirm.transacciones_activas.length} deuda(s) activa(s).
              </p>
            )}
            <div className="flex gap-2 justify-end mt-4">
              <button className="btn-outline" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className="btn-primary" style={{ background: '#ef4444' }}
                      onClick={async () => {
                        try {
                          await api.deleteCliente(deleteConfirm.id);
                          setDeleteConfirm(null);
                          setDetail(null);
                          setSelected(null);
                          load(search);
                        } catch (err) { alert(err.detail || 'Error al eliminar'); }
                      }}>
                Si, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
