import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Users, Search, Pencil, UserX } from 'lucide-react'
import { contactosApi } from '../api/endpoints/contactos.js'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import Modal from '../components/ui/Modal.jsx'
import Input from '../components/ui/Input.jsx'
import Select from '../components/ui/Select.jsx'
import Button from '../components/ui/Button.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'

const schema = z.object({
  nombre: z.string().min(1, 'Requerido').max(120),
  alias: z.string().max(60).optional(),
  telefono: z.string().max(20).optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  notas: z.string().optional(),
  calificacion: z.enum(['Bueno','Normal','Riesgo']).default('Normal'),
})

const CALIFICACIONES = [{ value: 'Bueno', label: 'Bueno' }, { value: 'Normal', label: 'Normal' }, { value: 'Riesgo', label: 'Riesgo' }]
const calColor = { Bueno: 'success', Normal: 'muted', Riesgo: 'danger' }

function ContactoModal({ open, onClose, contacto }) {
  const qc = useQueryClient()
  const isEditing = !!contacto
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: contacto ?? { calificacion: 'Normal' },
  })
  const mutation = useMutation({
    mutationFn: (d) => {
      // Limpiar campos vacíos que fallarían la validación del backend
      const payload = { ...d }
      if (!payload.email) delete payload.email
      if (!payload.alias) delete payload.alias
      if (!payload.telefono) delete payload.telefono
      if (!payload.notas) delete payload.notas
      return isEditing ? contactosApi.updateContacto(contacto.id, payload) : contactosApi.createContacto(payload)
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contactos'] }); reset(); onClose() },
  })
  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Editar contacto' : 'Nuevo contacto'}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-4">
        <Input label="Nombre" placeholder="Juan García" error={errors.nombre?.message} {...register('nombre')} />
        <Input label="Alias" placeholder="Juancho" {...register('alias')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Teléfono" placeholder="+57 300..." {...register('telefono')} />
          <Input label="Email" type="email" placeholder="juan@mail.com" error={errors.email?.message} {...register('email')} />
        </div>
        <Select label="Calificación" options={CALIFICACIONES} {...register('calificacion')} />
        <Input label="Notas" placeholder="Opcional" {...register('notas')} />
        {mutation.error && <p className="text-xs text-danger">{mutation.error.response?.data?.error?.message || 'Error'}</p>}
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button type="submit" loading={mutation.isPending} className="flex-1">{isEditing ? 'Guardar' : 'Crear'}</Button>
        </div>
      </form>
    </Modal>
  )
}

export default function ContactosPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({ queryKey: ['contactos'], queryFn: contactosApi.getContactos })
  const contactos = (data?.data?.data ?? []).filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase())
  )

  const deleteMutation = useMutation({
    mutationFn: (id) => contactosApi.deleteContacto(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contactos'] }); setDeleteTarget(null) },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground">Contactos</h1>
        <Button onClick={() => setModal('create')}><Plus size={16} /> Nuevo contacto</Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          placeholder="Buscar por nombre..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-input-bg text-sm text-foreground outline-none focus:border-primary"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map((i) => <div key={i} className="h-24 bg-card rounded-xl animate-pulse border border-border" />)}
        </div>
      ) : contactos.length === 0 ? (
        <EmptyState icon={Users} title="Sin contactos" description="Agrega contactos para gestionar tus deudas." action={{ label: 'Nuevo contacto', onClick: () => setModal('create') }} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {contactos.map((c) => (
            <Card key={c.id} className="p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                {c.nombre.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{c.nombre}</p>
                {c.alias && <p className="text-xs text-muted">{c.alias}</p>}
                {c.telefono && <p className="text-xs text-muted">{c.telefono}</p>}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <Badge variant={calColor[c.calificacion] ?? 'muted'}>{c.calificacion}</Badge>
                <div className="flex gap-2">
                  <button onClick={() => setModal(c)} className="text-muted hover:text-primary transition-colors"><Pencil size={13} /></button>
                  <button onClick={() => setDeleteTarget(c)} className="text-muted hover:text-danger transition-colors"><UserX size={13} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ContactoModal open={!!modal} onClose={() => setModal(null)} contacto={modal === 'create' ? null : modal} />
      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        title="¿Desactivar contacto?" description={`"${deleteTarget?.nombre}" se desactivará.`}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
