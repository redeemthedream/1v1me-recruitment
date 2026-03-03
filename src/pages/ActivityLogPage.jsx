import { useState } from 'react'
import { useActivityLog } from '../hooks/useActivityLog'
import { formatRelativeTime } from '../utils/formatters'

export default function ActivityLogPage() {
  const [entityFilter, setEntityFilter] = useState('')
  const { activities, loading } = useActivityLog(entityFilter || undefined, undefined, 100)

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-text-muted">Loading activity...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Activity Log</h1>
          <p className="text-sm text-text-secondary mt-1">Full audit trail of all changes</p>
        </div>
        <select
          value={entityFilter}
          onChange={e => setEntityFilter(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="player">Players</option>
          <option value="game">Games</option>
        </select>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-16 text-text-muted">No activity recorded yet</div>
      ) : (
        <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
          {activities.map((a, idx) => (
            <div
              key={a.id}
              className={`flex items-start gap-4 px-5 py-3 ${idx > 0 ? 'border-t border-border' : ''}`}
            >
              <div className="w-20 shrink-0 text-xs text-text-muted pt-0.5">
                {formatRelativeTime(a.created_at)}
              </div>
              <div className="flex-1">
                <span className="text-sm">
                  <span className="font-medium text-text-primary">{a.user?.display_name || 'System'}</span>{' '}
                  <span className="text-text-secondary">{a.action}</span>{' '}
                  <span className="text-text-muted">{a.entity_type}</span>{' '}
                  {a.entity_name && <span className="text-neon font-medium">{a.entity_name}</span>}
                </span>
                {a.details && (
                  <div className="text-xs text-text-muted mt-0.5">
                    {Object.entries(a.details).map(([k, v]) => (
                      <span key={k} className="mr-3">{k}: {String(v)}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
