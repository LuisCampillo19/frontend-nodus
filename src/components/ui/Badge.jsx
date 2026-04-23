import { cn } from '../../utils/cn.js'

const variants = {
  success: 'bg-success-bg text-success',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger',
  info: 'bg-info-bg text-info',
  muted: 'bg-input-bg text-muted',
}

export default function Badge({ variant = 'muted', children, className }) {
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold', variants[variant], className)}>
      {children}
    </span>
  )
}
