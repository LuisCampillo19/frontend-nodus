import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Settings, Lock, Sun, Moon, Monitor } from 'lucide-react'
import { usuariosApi } from '../api/endpoints/usuarios.js'
import { useThemeStore } from '../stores/themeStore.js'
import { useAuthStore } from '../stores/authStore.js'
import Card from '../components/ui/Card.jsx'
import Input from '../components/ui/Input.jsx'
import Button from '../components/ui/Button.jsx'
import { cn } from '../utils/cn.js'

const perfilSchema = z.object({
  nombre: z.string().min(1, 'Requerido').max(100),
  telefono: z.string().max(20).optional().or(z.literal('')),
  avatar_url: z.string().url('URL inválida').optional().or(z.literal('')),
})

const passwordSchema = z.object({
  password_actual: z.string().min(6, 'Mínimo 6 caracteres'),
  password_nuevo: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmar_password: z.string().min(6, 'Mínimo 6 caracteres'),
}).refine((d) => d.password_nuevo === d.confirmar_password, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmar_password'],
})

function Section({ icon: Icon, title, children }) {
  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <Icon size={18} className="text-primary" />
        <h2 className="text-base font-bold text-foreground">{title}</h2>
      </div>
      {children}
    </Card>
  )
}

function PerfilSection() {
  const qc = useQueryClient()
  const setAuth = useAuthStore((s) => s.setAuth)
  const user = useAuthStore((s) => s.user)

  const { data } = useQuery({ queryKey: ['me'], queryFn: usuariosApi.getMe })
  const me = data?.data?.data

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(perfilSchema),
    defaultValues: { nombre: '', telefono: '', avatar_url: '' },
  })

  useEffect(() => {
    if (me) reset({ nombre: me.nombre ?? '', telefono: me.telefono ?? '', avatar_url: me.avatar_url ?? '' })
  }, [me, reset])

  const mutation = useMutation({
    mutationFn: (d) => usuariosApi.updateMe(d),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['me'] })
      const updated = res.data?.data
      if (updated && user) setAuth({ ...user, nombre: updated.nombre }, useAuthStore.getState().accessToken)
    },
  })

  return (
    <Section icon={User} title="Perfil">
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col gap-4">
        <Input label="Nombre" placeholder="Tu nombre" error={errors.nombre?.message} {...register('nombre')} />
        <div className="grid grid-cols-2 gap-3">
          <Input label="Teléfono" placeholder="+57 300..." {...register('telefono')} />
          <Input label="Avatar URL" placeholder="https://..." {...register('avatar_url')} />
        </div>
        {mutation.error && <p className="text-xs text-danger">{mutation.error.response?.data?.error?.message || 'Error'}</p>}
        {mutation.isSuccess && <p className="text-xs text-success">Perfil actualizado correctamente.</p>}
        <div className="flex justify-end">
          <Button type="submit" loading={mutation.isPending}>Guardar cambios</Button>
        </div>
      </form>
    </Section>
  )
}

function TemaSection() {
  const { tema, setTema } = useThemeStore()

  const opciones = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Oscuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor },
  ]

  return (
    <Section icon={Settings} title="Preferencias">
      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground block">Tema de interfaz</label>
        <div className="flex gap-3">
          {opciones.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTema(value)}
              className={cn(
                'flex-1 flex flex-col items-center gap-2 py-4 px-3 rounded-xl border-2 transition-all',
                tema === value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-card text-muted hover:border-primary/40'
              )}
            >
              <Icon size={20} />
              <span className="text-sm font-semibold">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </Section>
  )
}

function SeguridadSection() {
  const { register, handleSubmit, reset, formState: { errors }, setError } = useForm({
    resolver: zodResolver(passwordSchema),
  })

  function onSubmit(d) {
    // Show a "próximamente" message or call endpoint if available
    setError('root', { message: 'Cambio de contraseña: próximamente disponible.' })
    reset()
  }

  return (
    <Section icon={Lock} title="Seguridad">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Contraseña actual" type="password" placeholder="••••••••" error={errors.password_actual?.message} {...register('password_actual')} />
        <Input label="Nueva contraseña" type="password" placeholder="••••••••" error={errors.password_nuevo?.message} {...register('password_nuevo')} />
        <Input label="Confirmar contraseña" type="password" placeholder="••••••••" error={errors.confirmar_password?.message} {...register('confirmar_password')} />
        {errors.root && <p className="text-xs text-warning bg-warning/10 rounded-lg px-3 py-2">{errors.root.message}</p>}
        <div className="flex justify-end">
          <Button type="submit">Cambiar contraseña</Button>
        </div>
      </form>
    </Section>
  )
}

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-black text-foreground">Configuración</h1>
      <PerfilSection />
      <TemaSection />
      <SeguridadSection />
    </div>
  )
}
