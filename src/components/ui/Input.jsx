import { forwardRef } from 'react'
import { cn } from '../../utils/cn.js'

const Input = forwardRef(({ label, error, icon: Icon, className, ...rest }, ref) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-semibold text-foreground">{label}</label>}
    <div className="relative">
      {Icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">
          <Icon size={16} />
        </span>
      )}
      <input
        ref={ref}
        className={cn(
          'w-full rounded-xl border border-border bg-input-bg px-3 py-2.5 text-sm text-foreground placeholder:text-muted outline-none transition-all',
          'focus:border-primary focus:ring-2 focus:ring-primary/20',
          error && 'border-danger focus:border-danger focus:ring-danger/20',
          Icon && 'pl-9',
          className
        )}
        {...rest}
      />
    </div>
    {error && <span className="text-xs text-danger">{error}</span>}
  </div>
))
Input.displayName = 'Input'
export default Input
