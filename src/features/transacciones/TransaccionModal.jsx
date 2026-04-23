import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Modal from '../../components/ui/Modal.jsx'
import Input from '../../components/ui/Input.jsx'
import Select from '../../components/ui/Select.jsx'
import DatePicker from '../../components/ui/DatePicker.jsx'
import Button from '../../components/ui/Button.jsx'
import { transaccionesApi } from '../../api/endpoints/transacciones.js'
import { cuentasApi } from '../../api/endpoints/cuentas.js'
import { categoriasApi } from '../../api/endpoints/categorias.js'
import { cn } from '../../utils/cn.js'

const TIPOS = ['Ingreso', 'Gasto', 'Transferencia']

const schema = z.object({
  monto: z.coerce.number().positive('El monto debe ser positivo'),
  descripcion: z.string().optional(),
  fecha: z.string().optional(),
  cuenta_origen_id: z.coerce.number().optional(),
  cuenta_destino_id: z.coerce.number().optional(),
  categoria_id: z.coerce.number().optional(),
})

export default function TransaccionModal({ open, onClose, transaccion }) {
  const qc = useQueryClient()
  const [tipo, setTipo] = useState(transaccion?.tipo ?? 'Gasto')
  const isEditing = !!transaccion

  const { data: cuentasData } = useQuery({ queryKey: ['cuentas'], queryFn: cuentasApi.getCuentas, enabled: open })
  const { data: categoriasData } = useQuery({ queryKey: ['categorias'], queryFn: () => categoriasApi.getCategorias(), enabled: open })

  const cuentas = (cuentasData?.data?.data ?? []).map((c) => ({ value: c.id, label: `${c.nombre} (${c.tipo})` }))
  const categorias = (categoriasData?.data?.data ?? []).map((c) => ({ value: c.id, label: `${c.icono || ''} ${c.nombre}`.trim() }))

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: transaccion ? {
      monto: transaccion.monto,
      descripcion: transaccion.descripcion || '',
      fecha: transaccion.fecha?.slice(0, 10) || '',
      cuenta_origen_id: transaccion.cuenta_origen_id || '',
      cuenta_destino_id: transaccion.cuenta_destino_id || '',
      categoria_id: transaccion.categoria_id || '',
    } : {},
  })

  const mutation = useMutation({
    mutationFn: (data) => {
      const payload = { ...data, tipo }
      if (!payload.cuenta_origen_id) delete payload.cuenta_origen_id
      if (!payload.cuenta_destino_id) delete payload.cuenta_destino_id
      if (!payload.categoria_id) delete payload.categoria_id
      return isEditing
        ? transaccionesApi.updateTransaccion(transaccion.id, payload)
        : transaccionesApi.createTransaccion(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transacciones'] })
      qc.invalidateQueries({ queryKey: ['cuentas'] })
      reset()
      onClose()
    },
  })

  function onSubmit(values) { mutation.mutate(values) }

  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Editar transacción' : 'Nueva transacción'}>
      {/* Tabs tipo */}
      <div className="flex gap-1 bg-input-bg rounded-xl p-1 mb-5">
        {TIPOS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTipo(t)}
            className={cn(
              'flex-1 py-2 rounded-lg text-sm font-semibold transition-all',
              tipo === t ? 'bg-card text-primary shadow-sm' : 'text-muted hover:text-foreground'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Monto" type="number" step="0.01" placeholder="0" error={errors.monto?.message} {...register('monto')} />

        {(tipo === 'Gasto' || tipo === 'Transferencia') && (
          <Select label="Cuenta origen" options={cuentas} placeholder="Seleccionar cuenta" error={errors.cuenta_origen_id?.message} {...register('cuenta_origen_id')} />
        )}
        {(tipo === 'Ingreso' || tipo === 'Transferencia') && (
          <Select label="Cuenta destino" options={cuentas} placeholder="Seleccionar cuenta" error={errors.cuenta_destino_id?.message} {...register('cuenta_destino_id')} />
        )}

        {tipo !== 'Transferencia' && (
          <Select label="Categoría" options={categorias} placeholder="Sin categoría" {...register('categoria_id')} />
        )}

        <Input label="Descripción" placeholder="Opcional" {...register('descripcion')} />
        <DatePicker label="Fecha" {...register('fecha')} />

        {mutation.error && (
          <p className="text-sm text-danger bg-danger-bg rounded-xl px-3 py-2">
            {mutation.error.response?.data?.error?.message || 'Error al guardar'}
          </p>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={mutation.isPending} className="flex-1">
            {isEditing ? 'Guardar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
