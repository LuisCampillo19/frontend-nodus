import Spinner from './Spinner.jsx'
import EmptyState from './EmptyState.jsx'
import { cn } from '../../utils/cn.js'

export default function Table({ columns = [], data = [], loading, emptyMessage = 'Sin datos' }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-input-bg border-b border-border">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 bg-border rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-muted">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={row.id ?? i} className={cn('border-b border-border transition-colors hover:bg-input-bg/50', i % 2 === 1 && 'bg-background/40')}>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-foreground">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
