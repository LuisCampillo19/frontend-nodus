import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Tag, Pencil, Archive } from 'lucide-react'
import { categoriasApi } from '../api/endpoints/categorias.js'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import Modal from '../components/ui/Modal.jsx'
import Input from '../components/ui/Input.jsx'
import Button from '../components/ui/Button.jsx'
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'

const schema = z.object({
  nombre: z.string().min(1, 'Requerido').max(60),
  tipo: z.enum(['Ingreso', 'Gasto']),
  icono: z.string().optional(),
  color: z.string().optional(),
})

function CategoriaModal({ open, onClose, categoria }) {
  const qc = useQueryClient()
  const isEditing = !!categoria
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: categoria ?? { tipo: 'Gasto' },
  })
  const mutation = useMutation({
    mutationFn: (d) => isEditing ? categoriasApi.updateCategoria(categoria.id, d) : categoriasApi.createCategoria(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categorias'] }); reset(); onClose() },
  })
  return (
    <Modal open={open} onClose={onClose} title={isEditing ? 'Editar categoría' : 'Nueva categoría'}>
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-4">
        <Input label="Nombre" placeholder="Ej: Alimentación" error={errors.nombre?.message} {...register('nombre')} />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-foreground">Tipo</label>
          <div className="flex gap-3">
            {['Ingreso','Gasto'].map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value={t} {...register('tipo')} className="accent-primary" />
                <span className="text-sm text-foreground">{t}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Icono (emoji)" placeholder="🍔" {...register('icono')} />
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

function CategoriaList({ items, onEdit, onDelete }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((cat) => (
        <div key={cat.id} className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="text-xl">{cat.icono || '📁'}</span>
            <span className="font-semibold text-foreground text-sm">{cat.nombre}</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => onEdit(cat)} className="text-muted hover:text-primary transition-colors"><Pencil size={14} /></button>
            <button onClick={() => onDelete(cat)} className="text-muted hover:text-danger transition-colors"><Archive size={14} /></button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function CategoriasPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data, isLoading } = useQuery({ queryKey: ['categorias'], queryFn: () => categoriasApi.getCategorias() })
  const categorias = data?.data?.data ?? []
  const ingresos = categorias.filter((c) => c.tipo === 'Ingreso')
  const gastos = categorias.filter((c) => c.tipo === 'Gasto')

  const deleteMutation = useMutation({
    mutationFn: (id) => categoriasApi.deleteCategoria(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categorias'] }); setDeleteTarget(null) },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground">Categorías</h1>
        <Button onClick={() => setModal('create')}><Plus size={16} /> Nueva categoría</Button>
      </div>

      {isLoading ? <div className="h-48 bg-card rounded-xl animate-pulse border border-border" /> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3"><Badge variant="success">Ingreso</Badge><span className="text-sm text-muted">{ingresos.length}</span></div>
            {ingresos.length === 0 ? <p className="text-muted text-sm">Sin categorías de ingreso</p> : (
              <CategoriaList items={ingresos} onEdit={setModal} onDelete={setDeleteTarget} />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3"><Badge variant="danger">Gasto</Badge><span className="text-sm text-muted">{gastos.length}</span></div>
            {gastos.length === 0 ? <p className="text-muted text-sm">Sin categorías de gasto</p> : (
              <CategoriaList items={gastos} onEdit={setModal} onDelete={setDeleteTarget} />
            )}
          </div>
        </div>
      )}

      <CategoriaModal open={!!modal} onClose={() => setModal(null)} categoria={modal === 'create' ? null : modal} />
      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate(deleteTarget?.id)}
        title="¿Archivar categoría?" description={`"${deleteTarget?.nombre}" se archivará.`}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
