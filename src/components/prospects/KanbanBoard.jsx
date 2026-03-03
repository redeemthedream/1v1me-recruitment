import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RECRUITMENT_STATUSES, PRIORITIES, TIERS } from '../../constants/statusOptions'
import TierBadge from '../players/TierBadge'
import Badge from '../shared/Badge'

function KanbanCard({ player, onDragStart }) {
  const navigate = useNavigate()
  const priority = PRIORITIES.find(p => p.value === player.priority)

  return (
    <div
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('playerId', player.id); onDragStart?.(player.id) }}
      onClick={() => navigate(`/players/${player.id}`)}
      className="bg-bg-secondary border border-border rounded-lg p-3 cursor-pointer hover:border-border-light transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        {player.avatar_url && <img src={player.avatar_url} className="w-6 h-6 rounded-full object-cover" alt="" />}
        <span className="font-medium text-sm truncate">{player.ign}</span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        {player.game?.short_name && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-hover text-text-secondary">{player.game.short_name}</span>
        )}
        <TierBadge tier={player.tier} />
        {priority && <Badge label={priority.label} color={priority.color} size="sm" />}
      </div>
      {player.current_org && (
        <div className="text-xs text-text-muted mt-1.5 truncate">{player.current_org}</div>
      )}
    </div>
  )
}

function KanbanColumn({ status, players, onDrop }) {
  const [dragOver, setDragOver] = useState(false)

  return (
    <div
      className={`flex-1 min-w-[220px] max-w-[280px] kanban-col ${dragOver ? 'drag-over' : ''}`}
      onDragOver={e => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => {
        e.preventDefault()
        setDragOver(false)
        const playerId = e.dataTransfer.getData('playerId')
        if (playerId) onDrop(playerId, status.value)
      }}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: status.color }} />
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{status.label}</span>
        </div>
        <span className="text-xs text-text-muted bg-bg-hover px-1.5 py-0.5 rounded">{players.length}</span>
      </div>
      <div className="flex flex-col gap-2 p-2 rounded-xl bg-bg-card border border-border min-h-[200px]">
        {players.map(p => (
          <KanbanCard key={p.id} player={p} />
        ))}
        {players.length === 0 && (
          <div className="text-xs text-text-muted text-center py-8">Drop players here</div>
        )}
      </div>
    </div>
  )
}

export default function KanbanBoard({ players, onStatusChange }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {RECRUITMENT_STATUSES.map(status => (
        <KanbanColumn
          key={status.value}
          status={status}
          players={players.filter(p => p.recruitment_status === status.value)}
          onDrop={onStatusChange}
        />
      ))}
    </div>
  )
}
