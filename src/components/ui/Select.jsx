import { forwardRef } from 'react'
import { cn } from '../../utils/cn.js'

const Select = forwardRef(({ label, error, options = [], placeholder, className, ...rest }, ref) => (
  <div className="flex flex-col gap-1">
    {label && <label className="text-sm font-semibold text-foreground">{label}</label>}
    <select
      ref={ref}
      className={cn(
        'w-full rounded-xl border border-border bg-input-bg px-3 py-2.5 text-sm text-foreground outline-none transition-all appearance-none',
        'focus:border-primary focus:ring-2 focus:ring-primary/20',
        error && 'border-danger',
        className
      )}
      {...rest}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    {error && <span className="text-xs text-danger">{error}</span>}
  </div>
))
Select.displayName = 'Select'
export default Select
