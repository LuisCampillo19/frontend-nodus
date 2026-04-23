import Button from './Button.jsx'

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      {Icon && <Icon size={48} className="text-muted opacity-40" />}
      <h3 className="font-bold text-foreground text-base">{title}</h3>
      {description && <p className="text-sm text-muted max-w-xs">{description}</p>}
      {action && (
        <Button onClick={action.onClick} className="mt-2">{action.label}</Button>
      )}
    </div>
  )
}
