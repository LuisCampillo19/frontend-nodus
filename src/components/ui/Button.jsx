import { cn } from '../../utils/cn.js'
import Spinner from './Spinner.jsx'

const variants = {
  primary: 'bg-primary hover:bg-primary-hover text-white',
  secondary: 'bg-card border border-border text-foreground hover:bg-input-bg',
  ghost: 'bg-transparent text-foreground hover:bg-input-bg',
  danger: 'bg-danger hover:opacity-90 text-white',
}
const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({ variant = 'primary', size = 'md', loading, disabled, children, className, ...rest }) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}
