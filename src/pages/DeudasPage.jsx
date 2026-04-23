import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, HandCoins, TrendingUp, TrendingDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { deudasApi } from '../api/endpoints/deudas.js'
import { contactosApi } from '../api/endpoints/contactos.js'
import { cuentasApi } from '../api/endpoints/cuentas.js'
import { formatCOP, formatDate, formatPercent } from '../utils/formatters.js'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import Modal from '../components/ui/Modal.jsx'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import Button from '../components/ui/Button.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'
import { cn } from '../utils/cn.js'

const estadoColor = { Activa: 'info', Pagada: 'success', Vencida: 'danger', Cancelada: 'muted' }

const FRECUENCIAS = [
  { value: 'Unica', label: 'Pago único' },
  { value: 'Semanal', label: 'Semanal' },
  { value: 'Quincenal', label: 'Quincenal' },
  { value: 'Mensual', label: 'Mensual' },
  { value: 'Bimestral', label: 'Bimestral' },
  { value: 'Trimestral', label: 'Trimestral' },
  { value: 'Semestral', label: 'Semestral' },
  { value: 'Anual', label: 'Anual' },
]

const schema = z.object({
  contacto_id: z.coerce.number({ required_error: 'Requerido' }).positive('Selecciona un contacto'),
  cuenta_origen_id: z.coerce.number({ required_error: 'Requerido' }).positive('Selecciona una cuenta'),
  monto_capital: z.coerce.number().positive('Debe ser mayor a 0'),
  tasa_interes: z.coerce.number().min(0).default(0),
  frecuencia_pago: z.string().min(1, 'Requerido'),
  numero_cuotas: z.coerce.number().int().positive().default(1),
  fecha_inicio: z.string().min(1, 'Requerido'),
  rol: z.enum(['Acreedor', 'Deudor']),
  descripcion: z.string().optional(),
})

function DeudaModal({ open, onClose }) {
  const qc = useQueryClient()
  const { data: contactosData } = useQuery({ queryKey: ['contactos'], queryFn: contactosApi.getContactos, enabled: open })
  const { data: cuentasData } = useQuery({ queryKey: ['cuentas'], queryFn: cuentasApi.getCuentas, enabled: open })

  const contactosOpt = (contactosData?.data?.data ?? []).map((c) => ({ value: c.id, label: c.nombre }))
  const cuentasOpt = (cuentasData?.data?.data ?? []).map((c) => ({ value: c.id, label: `${c.icono || ''} ${c.nombre}`.trim() }))

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { rol: 'Acreedor', tasa_interes: 0, numero_cuotas: 1, frecuencia_pago: 'Mensual' },
  })

  const mutation = useMutation({
    mutationFn: (d) => deudasApi.createDeuda(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['deudas'] }); reset(); onClose() },
  })

  return (
    <Modal open={open} onClose={onClose} title="Nueva deuda">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-4">
        {/* Rol */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-foreground">Rol</label>
          <div className="flex gap-4">
            {['Acreedor', 'Deudor'].map((r) => (
              <label key={r} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value={r} {...register('rol')} className="accent-primary" />
                <span className="text-sm text-foreground">{r === 'Acreedor' ? 'Soy acreedor (presté dinero)' : 'Soy deudor (debo dinero)'}</span>
              </label>
            ))}
          </div>
        </div>

        <Select label="Contacto" options={contactosOpt} placeholder="Seleccionar..." error={errors.contacto_id?.message} {...register('contacto_id')} />
        <Select label="Cuenta" options={cuentasOpt} placeholder="Seleccionar..." error={errors.cuenta_origen_id?.message} {...register('cuenta_origen_id')} />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Capital" type="number" step="0.01" placeholder="0" error={errors.monto_capital?.message} {...register('monto_capital')} />
          <Input label="Tasa interés (%)" type="number" step="0.01" placeholder="0" {...register('tasa_interes')} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select label="Frecuencia" options={FRECUENCIAS} {...register('frecuencia_pago')} />
          <Input label="N° cuotas" type="number" min="1" placeholder="1" {...register('numero_cuotas')} />
        </div>

        <Input label="Fecha inicio" type="date" error={errors.fecha_inicio?.message} {...register('fecha_inicio')} />
        <Input label="Descripción" placeholder="Opcional" {...register('descripcion')} />

        {mutation.error && <p className="text-xs text-danger">{mutation.error.response?.data?.error?.message || 'Error'}</p>}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={mutation.isPending} className="flex-1">Crear</Button>
        </div>
      </form>
    </Modal>
  )
}

function DeudaCard({ deuda, onClick }) {
  const resumen = deuda.resumen ?? {}
  const capital = Number(deuda.monto_capital) || 0
  const pendiente = Number(resumen.saldo_pendiente ?? capital)
  const pagado = capital - pendiente
  const pct = capital > 0 ? Math.min(100, (pagado / capital) * 100) : 0

  return (
    <Card
      className="p-5 cursor-pointer hover:shadow-md transition-shadow flex flex-col gap-3"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-foreground">{deuda.contacto?.nombre ?? '—'}</p>
          {deuda.descripcion && <p className="text-xs text-muted mt-0.5">{deuda.descripcion}</p>}
        </div>
        <Badge variant={estadoColor[deuda.estado] ?? 'muted'}>{deuda.estado}</Badge>
      </div>

      <div className="flex justify-between text-sm">
        <div>
          <p className="text-xs text-muted">Capital</p>
          <p className="font-semibold text-foreground">{formatCOP(capital)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted">Pendiente</p>
          <p className={`font-semibold ${pendiente > 0 ? 'text-danger' : 'text-success'}`}>{formatCOP(pendiente)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="h-2 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-muted text-right">{formatPercent(pct)} pagado</p>
      </div>

      <div className="flex justify-between text-xs text-muted pt-1 border-t border-border">
        <span>Inicio: {formatDate(deuda.fecha_inicio)}</span>
        {deuda.frecuencia_pago && <span>{deuda.frecuencia_pago}</span>}
      </div>
    </Card>
  )
}

export default function DeudasPage() {
  const navigate = useNavigate()
  const [modal, setModal] = useState(false)
  const [tab, setTab] = useState('Acreedor')

  const { data, isLoading } = useQuery({
    queryKey: ['deudas', { rol: tab }],
    queryFn: () => deudasApi.getDeudas({ rol: tab }),
  })
  const deudas = data?.data?.data ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground">Deudas</h1>
        <Button onClick={() => setModal(true)}><Plus size={16} /> Nueva deuda</Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-input-bg rounded-xl p-1 w-fit">
        {[
          { key: 'Acreedor', label: 'Soy acreedor', icon: TrendingUp },
          { key: 'Deudor', label: 'Soy deudor', icon: TrendingDown },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
              tab === key ? 'bg-card text-primary shadow-sm' : 'text-muted hover:text-foreground'
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-44 bg-card rounded-xl animate-pulse border border-border" />)}
        </div>
      ) : deudas.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title={tab === 'Acreedor' ? 'Sin deudas activas' : 'No debes nada'}
          description={tab === 'Acreedor' ? 'Registra una deuda cuando prestes dinero.' : 'Registra una deuda cuando alguien te preste dinero.'}
          action={{ label: 'Nueva deuda', onClick: () => setModal(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {deudas.map((d) => (
            <DeudaCard key={d.id} deuda={d} onClick={() => navigate(`/deudas/${d.id}`)} />
          ))}
        </div>
      )}

      <DeudaModal open={modal} onClose={() => setModal(false)} />
    </div>
  )
}
