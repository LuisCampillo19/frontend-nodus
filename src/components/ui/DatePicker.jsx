import { forwardRef } from 'react'
import { cn } from '../../utils/cn.js'

const DatePicker = forwardRef(({ label, error, className, ...rest }, ref) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-semibold text-foreground">{label}</label>}
    <input
      ref={ref}
      type="date"
      className={cn(
        'w-full rounded-xl border border-border bg-input-bg px-3 py-2.5 text-sm text-foreground outline-none transition-all',
        'focus:border-primary focus:ring-2 focus:ring-primary/20',
        error && 'border-danger',
        className
      )}
      {...rest}
    />
    {error && <span className="text-xs text-danger">{error}</span>}
  </div>
))
DatePicker.displayName = 'DatePicker'
export default DatePicker
