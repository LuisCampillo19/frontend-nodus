import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Wallet, Pencil, Archive } from 'lucide-react'
import { cuentasApi } from '../api/endpoints/cuentas.js'
import { formatCOP } from '../utils/formatters.js'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import Modal from '../components/ui/Modal.jsx'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import Button from '../components/ui/Button.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'

const TIPOS = ['Efectivo','Debito','Credito','Ahorro','Inversion','Otro'].map((v) => ({ value: v, label: v }))

const schema = z.object({
  nombre: z.string().min(1, 'Requerido').max(60),
  tipo: z.string().min(1, 'Requerido'),
  saldo_inicial: z.coerce.number().default(0),
  moneda: z.string().default('COP'),
  color: z.string().optional(),
  icono: z.string().optional(),
})

function CuentaModal({ open, onClose, cuenta }) {
  const qc = useQueryClient()
  const isEditing = !!cuenta
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: cuenta ?? { tipo: 'Debito', moneda: 'COP', saldo_inicial: 0 },
  })
  const mutation = useMutation({
    mutationFn: (d) => isEditing ? cuentasApi.updateCuenta(cuenta.id, d) : cuentasApi.createCuenta(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cuentas'] }); reset(); onClose() },
  })
  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Editar cuenta' : 'Nueva cuenta'}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-4">
        <Input label="Nombre" placeholder="Ej: Bancolombia" error={errors.nombre?.message} {...register('nombre')} />
        <Select label="Tipo" options={TIPOS} error={errors.tipo?.message} {...register('tipo')} />
        {!isEditing && <Input label="Saldo inicial" type="number" step="0.01" placeholder="0" {...register('saldo_inicial')} />}
        <div className="grid grid-cols-2 gap-3">
          <Input label="Icono (emoji)" placeholder="💳" {...register('icono')} />
          <Input label="Color" type="color" {...register('color')} />
        </div>
        {mutation.error && <p className="text-xs text-danger">{mutation.error.response?.data?.error?.message || 'Error'}</p>}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={mutation.isPending} className="flex-1">{isEditing ? 'Guardar' : 'Crear'}</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function CuentasPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null) // null | 'create' | cuenta
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data, isLoading } = useQuery({ queryKey: ['cuentas'], queryFn: cuentasApi.getCuentas })
  const cuentas = data?.data?.data ?? []

  const deleteMutation = useMutation({
    mutationFn: (id) => cuentasApi.deleteCuenta(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cuentas'] }); setDeleteTarget(null) },
  })

  const tipoColor = { Efectivo: 'success', Debito: 'info', Credito: 'danger', Ahorro: 'success', Inversion: 'warning', Otro: 'muted' }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground">Cuentas</h1>
        <Button onClick={() => setModal('create')}><Plus size={16} /> Nueva cuenta</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map((i) => <div key={i} className="h-32 bg-card rounded-xl animate-pulse border border-border" />)}
        </div>
      ) : cuentas.length === 0 ? (
        <EmptyState icon={Wallet} title="Sin cuentas" description="Crea tu primera cuenta para empezar." action={{ label: 'Nueva cuenta', onClick: () => setModal('create') }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {cuentas.map((c) => (
            <Card key={c.id} className="p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{c.icono || '💳'}</span>
                  <span className="font-bold text-foreground">{c.nombre}</span>
                </div>
                <Badge variant={tipoColor[c.tipo] ?? 'muted'}>{c.tipo}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted">Saldo actual</p>
                <p className={`text-2xl font-black ${Number(c.saldo_actual) >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatCOP(c.saldo_actual)}
                </p>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => setModal(c)} className="flex items-center gap-1 text-xs text-muted hover:text-primary transition-colors">
                  <Pencil size={13} /> Editar
                </button>
                <button onClick={() => setDeleteTarget(c)} className="flex items-center gap-1 text-xs text-muted hover:text-danger transition-colors">
                  <Archive size={13} /> Archivar
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CuentaModal open={!!modal} onClose={() => setModal(null)} cuenta={modal === 'create' ? null : modal} />
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        title="¿Archivar cuenta?"
        description={`La cuenta "${deleteTarget?.nombre}" se archivará y no aparecerá en la lista.`}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
