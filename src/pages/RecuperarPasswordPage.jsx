import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Mail, CheckCircle } from 'lucide-react'
import Input from '../components/ui/Input.jsx'
import Button from '../components/ui/Button.jsx'

const schema = z.object({ email: z.string().email('Email inválido') })

export default function RecuperarPasswordPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) })

  async function onSubmit() {
    await new Promise((r) => setTimeout(r, 800))
    setSent(true)
  }

  if (sent) return (
    <div className="text-center">
      <div className="flex justify-center mb-4"><CheckCircle size={48} className="text-success" /></div>
      <h2 className="text-xl font-bold text-foreground mb-2">¡Correo enviado!</h2>
      <p className="text-muted text-sm mb-6">Revisa tu bandeja de entrada y sigue las instrucciones.</p>
      <Link to="/login" className="text-primary font-semibold hover:underline text-sm">Volver al inicio de sesión</Link>
    </div>
  )

  return (
    <div>
      <h1 className="text-2xl font-black text-foreground mb-1">Recuperar contraseña</h1>
      <p className="text-muted text-sm mb-8">Te enviaremos un enlace a tu correo.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <Input label="Correo electrónico" icon={Mail} type="email" placeholder="tu@email.com"
          error={errors.email?.message} {...register('email')} />
        <Button type="submit" loading={isSubmitting} className="w-full mt-2">Enviar enlace</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        <Link to="/login" className="text-primary hover:underline">← Volver</Link>
      </p>
    </div>
  )
}
