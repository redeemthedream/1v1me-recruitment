import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePlayers } from '../hooks/usePlayers'
import { useGames } from '../hooks/useGames'
import { useExport } from '../hooks/useExport'
import { useToast } from '../components/shared/Toast'
import DataTable from '../components/shared/DataTable'
import FilterBar from '../components/shared/FilterBar'
import TierBadge from '../components/players/TierBadge'
import SocialLinks from '../components/players/SocialLinks'
import BulkActionsBar from '../components/players/BulkActionsBar'
import { applyFilters } from '../utils/filters'
import { formatDate } from '../utils/formatters'

export default function RosterPage() {
  const { players, loading, bulkUpdate, bulkDelete } = usePlayers('roster')
  const { games } = useGames()
  const { exportPlayers } = useExport()
  const toast = useToast()
  const navigate = useNavigate()
  const [filters, setFilters] = useState({})
  const [selected, setSelected] = useState([])

  const filtered = applyFilters(players, filters)

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
    { key: 'tier', label: 'Tier', render: (row) => <TierBadge tier={row.tier} /> },
    { key: 'region', label: 'Region' },
    { key: 'current_org', label: 'Org' },
    { key: 'socials', label: 'Socials', sortable: false, render: (row) => <SocialLinks player={row} compact /> },
    { key: 'updated_at', label: 'Added', render: (row) => <span className="text-text-muted text-xs">{formatDate(row.created_at)}</span> },
  ]

  async function handleBulkAction(action, value) {
    if (action === 'export') {
      const selectedPlayers = filtered.filter(p => selected.includes(p.id))
      exportPlayers(selectedPlayers.length > 0 ? selectedPlayers : filtered, games)
      toast('Exported to CSV')
      return
    }
    if (action === 'delete') {
      if (!confirm(`Delete ${selected.length} partner(s)?`)) return
      const { error } = await bulkDelete(selected)
      if (error) toast(error.message, 'error')
      else { toast('Partners deleted'); setSelected([]) }
      return
    }
    const { error } = await bulkUpdate(selected, { [action]: value })
    if (error) toast(error.message, 'error')
    else { toast('Partners updated'); setSelected([]) }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-text-muted">Loading partners...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Partners</h1>
          <p className="text-sm text-text-secondary mt-1">{filtered.length} partner{filtered.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => exportPlayers(filtered, games)}
          className="text-sm text-text-secondary hover:text-neon cursor-pointer bg-transparent border-none"
        >
          Export CSV
        </button>
      </div>

      <div className="mb-4">
        <FilterBar filters={filters} onChange={setFilters} games={games} />
      </div>

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
        emptyMessage="No partners found. Add players as partners to see them here."
      />
    </div>
  )
}
