import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Wallet, TrendingUp, TrendingDown, HandCoins, Plus } from 'lucide-react'
import { cuentasApi } from '../api/endpoints/cuentas.js'
import { transaccionesApi } from '../api/endpoints/transacciones.js'
import { deudasApi } from '../api/endpoints/deudas.js'
import { formatCOP, formatDate } from '../utils/formatters.js'
import Card from '../components/ui/Card.jsx'
import Badge from '../components/ui/Badge.jsx'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import TransaccionModal from '../features/transacciones/TransaccionModal.jsx'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'

const COLORS = ['#4880FF','#00B69B','#FFA756','#8280FF','#EF3826','#6366f1','#f59e0b','#10b981']

function KpiCard({ icon: Icon, label, value, color = 'text-primary', bg = 'bg-info-bg' }) {
  return (
    <Card className="p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bg}`}>
        <Icon size={22} className={color} />
      </div>
      <div>
        <p className="text-xs text-muted font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-xl font-black text-foreground mt-0.5">{value}</p>
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  const [showModal, setShowModal] = useState(false)

  const now = new Date()
  const desde = format(startOfMonth(now), 'yyyy-MM-dd')
  const hasta = format(endOfMonth(now), 'yyyy-MM-dd')

  const { data: cuentasData } = useQuery({ queryKey: ['cuentas'], queryFn: () => cuentasApi.getCuentas() })
  const { data: txMesData } = useQuery({
    queryKey: ['transacciones', 'mes', desde],
    queryFn: () => transaccionesApi.getTransacciones({ fecha_desde: desde, fecha_hasta: hasta, limit: 200 }),
  })
  const { data: txRecientesData } = useQuery({
    queryKey: ['transacciones', 'recientes'],
    queryFn: () => transaccionesApi.getTransacciones({ limit: 5 }),
  })
  const { data: deudasData } = useQuery({
    queryKey: ['deudas', 'activas'],
    queryFn: () => deudasApi.getDeudas({ estado: 'Activa' }),
  })

  const cuentas = cuentasData?.data?.data ?? []
  const txMes = txMesData?.data?.data ?? []
  const txRecientes = txRecientesData?.data?.data ?? []
  const deudas = deudasData?.data?.data ?? []

  const saldoTotal = cuentas.reduce((s, c) => s + Number(c.saldo_actual), 0)
  const ingresosMes = txMes.filter((t) => t.tipo === 'Ingreso').reduce((s, t) => s + Number(t.monto), 0)
  const gastosMes = txMes.filter((t) => t.tipo === 'Gasto').reduce((s, t) => s + Number(t.monto), 0)

  // Gastos por categoría para PieChart
  const gastosCat = {}
  txMes.filter((t) => t.tipo === 'Gasto').forEach((t) => {
    const key = t.categorias?.nombre || 'Sin categoría'
    gastosCat[key] = (gastosCat[key] || 0) + Number(t.monto)
  })
  const pieData = Object.entries(gastosCat).map(([name, value]) => ({ name, value }))

  // Ingresos vs Gastos últimos 6 meses para BarChart
  const barData = Array.from({ length: 6 }).map((_, i) => {
    const m = subMonths(now, 5 - i)
    const label = format(m, 'MMM', { locale: es })
    return { mes: label, Ingresos: 0, Gastos: 0 }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground">Dashboard</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
        >
          <Plus size={16} /> Nueva transacción
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard icon={Wallet} label="Saldo total" value={formatCOP(saldoTotal)} color="text-primary" bg="bg-info-bg" />
        <KpiCard icon={TrendingUp} label="Ingresos del mes" value={formatCOP(ingresosMes)} color="text-success" bg="bg-success-bg" />
        <KpiCard icon={TrendingDown} label="Gastos del mes" value={formatCOP(gastosMes)} color="text-danger" bg="bg-danger-bg" />
        <KpiCard icon={HandCoins} label="Deudas activas" value={deudas.length} color="text-warning" bg="bg-warning-bg" />
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <h2 className="font-bold text-foreground mb-4">Gastos por categoría</h2>
          {pieData.length === 0 ? (
            <p className="text-muted text-sm text-center py-8">Sin gastos este mes</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCOP(v)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-bold text-foreground mb-4">Ingresos vs Gastos</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barSize={12}>
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip formatter={(v) => formatCOP(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Ingresos" fill="var(--success)" radius={[4,4,0,0]} />
              <Bar dataKey="Gastos" fill="var(--danger)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Últimas transacciones */}
      <Card className="p-5">
        <h2 className="font-bold text-foreground mb-4">Últimas transacciones</h2>
        {txRecientes.length === 0 ? (
          <p className="text-muted text-sm text-center py-6">Sin transacciones</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {txRecientes.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{tx.descripcion || tx.tipo}</p>
                  <p className="text-xs text-muted">{tx.categorias?.nombre || '—'} · {formatDate(tx.fecha)}</p>
                </div>
                <span className={`font-bold text-sm ${tx.tipo === 'Ingreso' ? 'text-success' : tx.tipo === 'Gasto' ? 'text-danger' : 'text-info'}`}>
                  {tx.tipo === 'Gasto' ? '-' : '+'}{formatCOP(tx.monto)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <TransaccionModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
