import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock } from 'lucide-react'
import { useState } from 'react'
import Input from '../components/ui/Input.jsx'
import Button from '../components/ui/Button.jsx'
import { authApi } from '../api/endpoints/auth.js'
import { useAuthStore } from '../stores/authStore.js'

const schema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmar: z.string(),
}).refine((d) => d.password === d.confirmar, { message: 'Las contraseñas no coinciden', path: ['confirmar'] })

export default function RegistroPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit({ nombre, email, password }) {
    setError('')
    try {
      await authApi.register({ nombre, email, password })
      const loginRes = await authApi.login({ email, password })
      const { access_token, refresh_token } = loginRes.data.data
      const payload = JSON.parse(atob(access_token.split('.')[1]))
      setAuth({ id: payload.id, email: payload.email, nombre: payload.nombre }, access_token, refresh_token)
      navigate('/dashboard')
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Error al registrarse')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-foreground mb-1">Crear cuenta</h1>
      <p className="text-muted text-sm mb-8">Empieza a gestionar tus finanzas hoy</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Nombre completo" icon={User} placeholder="Juan Pérez"
          error={errors.nombre?.message} {...register('nombre')} />
        <Input label="Correo electrónico" icon={Mail} type="email" placeholder="tu@email.com"
          error={errors.email?.message} {...register('email')} />
        <Input label="Contraseña" icon={Lock} type="password" placeholder="••••••••"
          error={errors.password?.message} {...register('password')} />
        <Input label="Confirmar contraseña" icon={Lock} type="password" placeholder="••••••••"
          error={errors.confirmar?.message} {...register('confirmar')} />

        {error && <p className="text-sm text-danger bg-danger-bg rounded-xl px-3 py-2">{error}</p>}

        <Button type="submit" loading={isSubmitting} className="mt-2 w-full">Crear cuenta</Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        ¿Ya tienes cuenta? <Link to="/login" className="text-primary font-semibold hover:underline">Inicia sesión</Link>
      </p>
    </div>
  )
}
