import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import { useState } from 'react'
import Input from '../components/ui/Input.jsx'
import Button from '../components/ui/Button.jsx'
import { authApi } from '../api/endpoints/auth.js'
import { useAuthStore } from '../stores/authStore.js'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
})

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit(values) {
    setError('')
    try {
      const res = await authApi.login(values)
      const { access_token, refresh_token } = res.data.data
      // Decodificar user del token
      const payload = JSON.parse(atob(access_token.split('.')[1]))
      setAuth({ id: payload.id, email: payload.email, nombre: payload.nombre }, access_token, refresh_token)
      navigate('/dashboard')
    } catch (e) {
      setError(e.response?.data?.error?.message || 'Error al iniciar sesión')
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-foreground mb-1">Bienvenido</h1>
      <p className="text-muted text-sm mb-8">Inicia sesión en tu cuenta</p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Correo electrónico" icon={Mail} type="email" placeholder="tu@email.com"
          error={errors.email?.message} {...register('email')} />
        <Input label="Contraseña" icon={Lock} type="password" placeholder="••••••••"
          error={errors.password?.message} {...register('password')} />

        {error && <p className="text-sm text-danger bg-danger-bg rounded-xl px-3 py-2">{error}</p>}

        <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
          Iniciar sesión
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-muted space-y-2">
        <p><Link to="/recuperar-password" className="text-primary hover:underline">¿Olvidaste tu contraseña?</Link></p>
        <p>¿No tienes cuenta? <Link to="/registro" className="text-primary font-semibold hover:underline">Regístrate</Link></p>
      </div>
    </div>
  )
}
