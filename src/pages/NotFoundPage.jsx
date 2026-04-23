import { useNavigate } from 'react-router-dom'
import { Home, AlertCircle } from 'lucide-react'
import Button from '../components/ui/Button.jsx'

export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
        <AlertCircle size={40} className="text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-6xl font-black text-foreground">404</h1>
        <p className="text-lg font-semibold text-foreground">Página no encontrada</p>
        <p className="text-sm text-muted max-w-sm">La página que buscas no existe o fue movida a otra dirección.</p>
      </div>
      <Button onClick={() => navigate('/dashboard')}>
        <Home size={16} /> Volver al inicio
      </Button>
    </div>
  )
}
