import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, DollarSign } from 'lucide-react'
import { deudasApi } from '../api/endpoints/deudas.js'
import { cuentasApi } from '../api/endpoints/cuentas.js'
import { formatCOP, formatDate, formatPercent } from '../utils/formatters.js'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import Modal from '../components/ui/Modal.jsx'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import Button from '../components/ui/Button.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import { cn } from '../utils/cn.js'

const estadoColor = { Activa: 'info', Pagada: 'success', Vencida: 'danger', Cancelada: 'muted' }
const cuotaColor = { Pagada: 'success', Pendiente: 'muted', Vencida: 'danger' }

const METODOS = [
  { value: 'Efectivo', label: 'Efectivo' },
  { value: 'Transferencia', label: 'Transferencia' },
  { value: 'Tarjeta', label: 'Tarjeta' },
  { value: 'Otro', label: 'Otro' },
]

const pagoSchema = z.object({
  cuota_id: z.coerce.number().positive('Selecciona una cuota'),
  cuenta_id: z.coerce.number().positive('Selecciona una cuenta'),
  monto: z.coerce.number().positive('Debe ser mayor a 0'),
  metodo: z.string().min(1, 'Requerido'),
  fecha: z.string().min(1, 'Requerido'),
  notas: z.string().optional(),
})

function PagoModal({ open, onClose, deudaId, cuotas, cuentas }) {
  const qc = useQueryClient()
  const pendientes = (cuotas ?? []).filter((c) => c.estado === 'Pendiente' || c.estado === 'Vencida')
  const cuotasOpt = pendientes.map((c) => ({
    value: c.id,
    label: `Cuota ${c.numero_cuota} — ${formatCOP(Number(c.monto_esperado_capital) + Number(c.monto_esperado_interes ?? 0))} — vence ${formatDate(c.fecha_vencimiento)}`,
  }))

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(pagoSchema),
    defaultValues: { metodo: 'Efectivo', fecha: new Date().toISOString().slice(0, 10) },
  })

  function onCuotaChange(e) {
    const found = pendientes.find((c) => String(c.id) === e.target.value)
    if (found) {
      setValue('monto', Number(found.monto_esperado_capital) + Number(found.monto_esperado_interes ?? 0))
    }
  }

  const mutation = useMutation({
    mutationFn: (d) => deudasApi.registrarPago(deudaId, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deuda', deudaId] })
      qc.invalidateQueries({ queryKey: ['cuentas'] })
      reset()
      onClose()
    },
  })

  return (
    <Modal open={open} onClose={onClose} title="Registrar pago">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-4">
        <Select
          label="Cuota"
          options={cuotasOpt}
          placeholder="Seleccionar cuota..."
          error={errors.cuota_id?.message}
          {...register('cuota_id')}
          onChange={(e) => { register('cuota_id').onChange(e); onCuotaChange(e) }}
        />
        <Select
          label="Cuenta de pago"
          options={cuentas}
          placeholder="Seleccionar cuenta..."
          error={errors.cuenta_id?.message}
          {...register('cuenta_id')}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Monto" type="number" step="0.01" error={errors.monto?.message} {...register('monto')} />
          <Select label="Método" options={METODOS} {...register('metodo')} />
        </div>
        <Input label="Fecha" type="date" error={errors.fecha?.message} {...register('fecha')} />
        <Input label="Notas" placeholder="Opcional" {...register('notas')} />

        {mutation.error && <p className="text-xs text-danger">{mutation.error.response?.data?.error?.message || 'Error'}</p>}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={mutation.isPending} className="flex-1">Registrar pago</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function DetalleDeudaPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pagoModal, setPagoModal] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['deuda', id],
    queryFn: () => deudasApi.getDeuda(id),
    enabled: !!id,
  })
  const { data: cuentasData } = useQuery({ queryKey: ['cuentas'], queryFn: cuentasApi.getCuentas })

  const deuda = data?.data?.data
  const cuotas = deuda?.cuotas ?? []
  const cuentasOpt = (cuentasData?.data?.data ?? []).map((c) => ({ value: c.id, label: `${c.icono || ''} ${c.nombre}`.trim() }))

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner size="lg" /></div>
  if (!deuda) return <p className="text-center text-muted pt-20">Deuda no encontrada.</p>

  const capital = Number(deuda.monto_capital) || 0
  const resumen = deuda.resumen ?? {}
  const pendiente = Number(resumen.saldo_pendiente ?? capital)
  const pagado = capital - pendiente
  const pct = capital > 0 ? Math.min(100, (pagado / capital) * 100) : 0
  const pendientesCuotas = cuotas.filter((c) => c.estado === 'Pendiente' || c.estado === 'Vencida')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/deudas')} className="text-muted hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-foreground">{deuda.contacto?.nombre ?? 'Deuda'}</h1>
          {deuda.descripcion && <p className="text-sm text-muted">{deuda.descripcion}</p>}
        </div>
        <Badge variant={estadoColor[deuda.estado] ?? 'muted'} className="text-base px-3 py-1">{deuda.estado}</Badge>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Capital', value: formatCOP(capital) },
          { label: 'Pagado', value: formatCOP(pagado), color: 'text-success' },
          { label: 'Pendiente', value: formatCOP(pendiente), color: pendiente > 0 ? 'text-danger' : 'text-success' },
          { label: 'Interés total', value: formatCOP(resumen.total_interes ?? 0) },
        ].map(({ label, value, color }) => (
          <Card key={label} className="p-4">
            <p className="text-xs text-muted mb-1">{label}</p>
            <p className={cn('text-xl font-black', color ?? 'text-foreground')}>{value}</p>
          </Card>
        ))}
      </div>

      {/* Progreso */}
      <Card className="p-5 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="font-semibold text-foreground">Progreso de pago</span>
          <span className="text-muted">{formatPercent(pct)}</span>
        </div>
        <div className="h-3 bg-border rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-muted">
          <span>Inicio: {formatDate(deuda.fecha_inicio)}</span>
          <span>{deuda.frecuencia_pago} · {cuotas.length} cuotas</span>
        </div>
      </Card>

      {/* Cuotas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Plan de cuotas</h2>
          {pendientesCuotas.length > 0 && (
            <Button onClick={() => setPagoModal(true)} size="sm">
              <DollarSign size={14} /> Registrar pago
            </Button>
          )}
        </div>

        <div className="w-full overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-input-bg border-b border-border">
                {['#', 'Vencimiento', 'Capital', 'Interés', 'Total', 'Estado'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cuotas.map((c) => {
                const total = Number(c.monto_esperado_capital) + Number(c.monto_esperado_interes ?? 0)
                const isVencida = c.estado === 'Vencida'
                return (
                  <tr
                    key={c.id}
                    className={cn(
                      'border-b border-border',
                      isVencida && 'bg-danger/5',
                    )}
                  >
                    <td className="px-4 py-3 font-semibold text-foreground">{c.numero_cuota}</td>
                    <td className={cn('px-4 py-3', isVencida && 'text-danger font-semibold')}>{formatDate(c.fecha_vencimiento)}</td>
                    <td className="px-4 py-3 text-foreground">{formatCOP(c.monto_esperado_capital)}</td>
                    <td className="px-4 py-3 text-muted">{formatCOP(c.monto_esperado_interes ?? 0)}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{formatCOP(total)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={cuotaColor[c.estado] ?? 'muted'}>{c.estado}</Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <PagoModal
        open={pagoModal}
        onClose={() => setPagoModal(false)}
        deudaId={id}
        cuotas={cuotas}
        cuentas={cuentasOpt}
      />
    </div>
  )
}
