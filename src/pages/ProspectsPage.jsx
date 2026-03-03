import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayers } from '../hooks/usePlayers'
import { useGames } from '../hooks/useGames'
import { useExport } from '../hooks/useExport'
import { useToast } from '../components/shared/Toast'
import DataTable from '../components/shared/DataTable'
import FilterBar from '../components/shared/FilterBar'
import Badge from '../components/shared/Badge'
import TierBadge from '../components/players/TierBadge'
import SocialLinks from '../components/players/SocialLinks'
import BulkActionsBar from '../components/players/BulkActionsBar'
import KanbanBoard from '../components/prospects/KanbanBoard'
import { applyFilters } from '../utils/filters'
import { formatDate } from '../utils/formatters'
import { PLAYER_STATUSES, RECRUITMENT_STATUSES, PRIORITIES } from '../constants/statusOptions'

export default function ProspectsPage() {
  const { players, loading, updatePlayer, bulkUpdate, bulkDelete } = usePlayers('prospect')
  const { games } = useGames()
  const { exportPlayers } = useExport()
  const toast = useToast()
  const navigate = useNavigate()
  const [filters, setFilters] = useState({})
  const [selected, setSelected] = useState([])
  const [view, setView] = useState('table')

  const filtered = applyFilters(players, filters)

  async function handleStatusChange(playerId, newStatus) {
    const { error } = await updatePlayer(playerId, { recruitment_status: newStatus })
    if (error) toast(error.message, 'error')
    else toast(`Moved to ${RECRUITMENT_STATUSES.find(s => s.value === newStatus)?.label}`)
  }

  const columns = [
    {
      key: 'ign', label: 'IGN', render: (row) => (
        <div className="flex items-center gap-2">
          {row.avatar_url && <img src={row.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" />}
          <span className="font-medium text-text-primary">{row.ign}</span>
        </div>
      )
    },
    { key: 'game', label: 'Game', render: (row) => <span className="text-text-secondary">{row.game?.short_name || '-'}</span> },
    { key: 'role', label: 'Role' },
    { key: 'tier', label: 'Tier', render: (row) => <TierBadge tier={row.tier} /> },
    {
      key: 'player_status', label: 'Status', render: (row) => {
        const s = PLAYER_STATUSES.find(x => x.value === row.player_status)
        return s ? <Badge label={s.label} color={s.color} /> : '-'
      }
    },
    {
      key: 'recruitment_status', label: 'Recruitment', render: (row) => {
        const s = RECRUITMENT_STATUSES.find(x => x.value === row.recruitment_status)
        return s ? <Badge label={s.label} color={s.color} /> : '-'
      }
    },
    {
      key: 'priority', label: 'Priority', render: (row) => {
        const p = PRIORITIES.find(x => x.value === row.priority)
        return p ? <Badge label={p.label} color={p.color} /> : '-'
      }
    },
    { key: 'region', label: 'Region' },
    { key: 'socials', label: 'Socials', sortable: false, render: (row) => <SocialLinks player={row} compact /> },
    { key: 'updated_at', label: 'Updated', render: (row) => <span className="text-text-muted text-xs">{formatDate(row.updated_at)}</span> },
  ]

  async function handleBulkAction(action, value) {
    if (action === 'export') {
      const selectedPlayers = filtered.filter(p => selected.includes(p.id))
      exportPlayers(selectedPlayers.length > 0 ? selectedPlayers : filtered, games)
      toast('Exported to CSV')
      return
    }
    if (action === 'delete') {
      if (!confirm(`Delete ${selected.length} player(s)?`)) return
      const { error } = await bulkDelete(selected)
      if (error) toast(error.message, 'error')
      else { toast('Players deleted'); setSelected([]) }
      return
    }
    const { error } = await bulkUpdate(selected, { [action]: value })
    if (error) toast(error.message, 'error')
    else { toast('Players updated'); setSelected([]) }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-text-muted">Loading prospects...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Prospects</h1>
          <p className="text-sm text-text-secondary mt-1">{filtered.length} prospect{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-bg-card border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setView('table')}
              className={`px-3 py-1.5 text-xs cursor-pointer border-none ${
                view === 'table' ? 'bg-neon/10 text-neon' : 'bg-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-1.5 text-xs cursor-pointer border-none ${
                view === 'kanban' ? 'bg-neon/10 text-neon' : 'bg-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Kanban
            </button>
          </div>
          <button
            onClick={() => exportPlayers(filtered, games)}
            className="text-sm text-text-secondary hover:text-neon cursor-pointer bg-transparent border-none"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="mb-4">
        <FilterBar filters={filters} onChange={setFilters} games={games} showRecruitment />
      </div>

      {view === 'kanban' ? (
        <KanbanBoard players={filtered} onStatusChange={handleStatusChange} />
      ) : (
        <>
          {selected.length > 0 && (
            <BulkActionsBar
              count={selected.length}
              onAction={handleBulkAction}
              onClear={() => setSelected([])}
            />
          )}
          <DataTable
            columns={columns}
            data={filtered}
            onRowClick={(row) => navigate(`/players/${row.id}`)}
            selectable
            selected={selected}
            onSelectionChange={setSelected}
            emptyMessage="No prospects found. Start scouting to add prospects."
          />
        </>
      )}
    </div>
  )
}
