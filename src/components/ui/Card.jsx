import { cn } from '../../utils/cn.js'

export default function Card({ children, className, ...rest }) {
  return (
    <div
      className={cn('bg-card border border-border rounded-xl shadow-sm', className)}
      {...rest}
    >
      {children}
    </div>
  )
}
