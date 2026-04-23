import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ArrowLeftRight, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { transaccionesApi } from '../api/endpoints/transacciones.js'
import { cuentasApi } from '../api/endpoints/cuentas.js'
import { categoriasApi } from '../api/endpoints/categorias.js'
import { formatCOP, formatDate } from '../utils/formatters.js'
import Table from '../components/ui/Table.jsx'
import Badge from '../components/ui/Badge.jsx'
import Button from '../components/ui/Button.jsx'
import Select from '../components/ui/Select.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import TransaccionModal from '../features/transacciones/TransaccionModal.jsx'

const TIPOS_OPT = [
  { value: '', label: 'Todos los tipos' },
  { value: 'Ingreso', label: 'Ingreso' },
  { value: 'Gasto', label: 'Gasto' },
  { value: 'Transferencia', label: 'Transferencia' },
]

const tipoColor = { Ingreso: 'success', Gasto: 'danger', Transferencia: 'info' }

const LIMIT = 15

export default function TransaccionesPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ tipo: '', categoria_id: '', cuenta_id: '', fecha_desde: '', fecha_hasta: '' })

  const params = { page, limit: LIMIT, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '')) }

  const { data, isLoading } = useQuery({ queryKey: ['transacciones', params], queryFn: () => transaccionesApi.getTransacciones(params) })
  const { data: cuentasData } = useQuery({ queryKey: ['cuentas'], queryFn: cuentasApi.getCuentas })
  const { data: catData } = useQuery({ queryKey: ['categorias'], queryFn: () => categoriasApi.getCategorias() })

  const transacciones = data?.data?.data ?? []
  const meta = data?.data?.meta ?? {}
  const totalPages = meta.total_pages ?? 1

  const cuentasOpt = [{ value: '', label: 'Todas las cuentas' }, ...(cuentasData?.data?.data ?? []).map((c) => ({ value: c.id, label: c.nombre }))]
  const catOpt = [{ value: '', label: 'Todas las categorías' }, ...(catData?.data?.data ?? []).map((c) => ({ value: c.id, label: `${c.icono || ''} ${c.nombre}`.trim() }))]

  const deleteMutation = useMutation({
    mutationFn: (id) => transaccionesApi.deleteTransaccion(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transacciones'] })
      qc.invalidateQueries({ queryKey: ['cuentas'] })
      setDeleteTarget(null)
    },
  })

  function setFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }))
    setPage(1)
  }

  const columns = [
    {
      key: 'tipo',
      header: 'Tipo',
      render: (v) => <Badge variant={tipoColor[v] ?? 'muted'}>{v}</Badge>,
    },
    {
      key: 'descripcion',
      header: 'Descripción',
      render: (v) => <span className="max-w-[180px] truncate block">{v || <span className="text-muted italic">Sin descripción</span>}</span>,
    },
    {
      key: 'monto',
      header: 'Monto',
      render: (v, row) => (
        <span className={`font-semibold ${row.tipo === 'Ingreso' ? 'text-success' : row.tipo === 'Gasto' ? 'text-danger' : 'text-foreground'}`}>
          {formatCOP(v)}
        </span>
      ),
    },
    {
      key: 'fecha',
      header: 'Fecha',
      render: (v) => formatDate(v),
    },
    {
      key: 'categoria',
      header: 'Categoría',
      render: (_, row) => row.categoria ? (
        <span className="text-xs">{row.categoria.icono || ''} {row.categoria.nombre}</span>
      ) : <span className="text-muted text-xs">—</span>,
    },
    {
      key: 'cuenta',
      header: 'Cuenta',
      render: (_, row) => {
        const nombre = row.cuenta_origen?.nombre || row.cuenta_destino?.nombre || '—'
        return <span className="text-xs text-muted">{nombre}</span>
      },
    },
    {
      key: 'acciones',
      header: '',
      render: (_, row) => (
        <div className="flex gap-2 justify-end">
          <button onClick={() => setModal(row)} className="text-muted hover:text-primary transition-colors"><Pencil size={13} /></button>
          <button onClick={() => setDeleteTarget(row)} className="text-muted hover:text-danger transition-colors"><Trash2 size={13} /></button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground">Transacciones</h1>
        <Button onClick={() => setModal('create')}><Plus size={16} /> Nueva transacción</Button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Select options={TIPOS_OPT} value={filters.tipo} onChange={(e) => setFilter('tipo', e.target.value)} />
        <Select options={cuentasOpt} value={filters.cuenta_id} onChange={(e) => setFilter('cuenta_id', e.target.value)} />
        <Select options={catOpt} value={filters.categoria_id} onChange={(e) => setFilter('categoria_id', e.target.value)} />
        <input
          type="date"
          value={filters.fecha_desde}
          onChange={(e) => setFilter('fecha_desde', e.target.value)}
          className="px-3 py-2 rounded-xl border border-border bg-input-bg text-sm text-foreground outline-none focus:border-primary"
          placeholder="Desde"
        />
        <input
          type="date"
          value={filters.fecha_hasta}
          onChange={(e) => setFilter('fecha_hasta', e.target.value)}
          className="px-3 py-2 rounded-xl border border-border bg-input-bg text-sm text-foreground outline-none focus:border-primary"
          placeholder="Hasta"
        />
      </div>

      {/* Tabla */}
      {!isLoading && transacciones.length === 0 ? (
        <EmptyState
          icon={ArrowLeftRight}
          title="Sin transacciones"
          description="Registra tu primera transacción para ver el historial."
          action={{ label: 'Nueva transacción', onClick: () => setModal('create') }}
        />
      ) : (
        <Table columns={columns} data={transacciones} loading={isLoading} emptyMessage="Sin transacciones" />
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-muted">Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft size={15} />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              <ChevronRight size={15} />
            </Button>
          </div>
        </div>
      )}

      <TransaccionModal
        open={!!modal}
        onClose={() => setModal(null)}
        transaccion={modal === 'create' ? null : modal}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        title="¿Eliminar transacción?"
        description="Esta acción revertirá el saldo de la cuenta afectada."
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
