import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full bg-white" />
          <div className="absolute bottom-[-60px] right-[-60px] w-56 h-56 rounded-full bg-white" />
        </div>
        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-black">N</div>
            <span className="text-3xl font-black tracking-tight">Nodus</span>
          </div>
          <p className="text-white/80 text-lg font-medium max-w-xs leading-relaxed">
            Tu dinero, bajo control. Gestiona tus finanzas personales de forma simple y visual.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4 text-left">
            {[
              { emoji: '💳', label: 'Cuentas y saldos' },
              { emoji: '📊', label: 'Análisis de gastos' },
              { emoji: '🤝', label: 'Gestión de deudas' },
              { emoji: '🤖', label: 'Asistente IA' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-2 bg-white/10 rounded-xl p-3">
                <span className="text-xl">{f.emoji}</span>
                <span className="text-sm font-semibold">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-white font-black text-sm">N</div>
            <span className="text-xl font-black text-foreground">Nodus</span>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
