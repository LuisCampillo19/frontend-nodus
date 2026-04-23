import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatCOP(monto) {
  if (monto == null) return '$ 0'
  const n = Number(monto)
  const formatted = new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(n))
  return `${n < 0 ? '-' : ''}$ ${formatted}`
}

export function formatDate(fecha) {
  if (!fecha) return ''
  try {
    return format(new Date(fecha), 'dd/MM/yyyy', { locale: es })
  } catch {
    return ''
  }
}

export function formatPercent(n) {
  if (n == null) return '0%'
  return `${Number(n).toFixed(1)}%`
}
