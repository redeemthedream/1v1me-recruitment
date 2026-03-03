import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import DataTable from '../components/shared/DataTable'
import Badge from '../components/shared/Badge'
import TierBadge from '../components/players/TierBadge'
import { PLAYER_STATUSES, RECRUITMENT_STATUSES, PRIORITIES } from '../constants/statusOptions'
import { formatDate } from '../utils/formatters'

export default function GameDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [game, setGame] = useState(null)
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('roster')

  useEffect(() => {
    async function fetch() {
      const [gameRes, playersRes] = await Promise.all([
        supabase.from('games').select('*').eq('id', id).single(),
        supabase.from('players').select('*').eq('game_id', id).order('updated_at', { ascending: false }),
      ])
      setGame(gameRes.data)
      setPlayers(playersRes.data || [])
      setLoading(false)
    }
    fetch()
  }, [id])

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-text-muted">Loading...</div>
  }

  if (!game) {
    return <div className="flex items-center justify-center h-64 text-text-muted">Game not found</div>
  }

  const roster = players.filter(p => p.category === 'roster')
  const prospects = players.filter(p => p.category === 'prospect')
  const current = tab === 'roster' ? roster : prospects

  const baseColumns = [
    {
      key: 'ign', label: 'IGN', render: (row) => (
        <div className="flex items-center gap-2">
          {row.avatar_url && <img src={row.avatar_url} className="w-7 h-7 rounded-full object-cover" alt="" />}
          <span className="font-medium text-text-primary">{row.ign}</span>
        </div>
      )
    },
    { key: 'tier', label: 'Tier', render: (row) => <TierBadge tier={row.tier} /> },
    { key: 'region', label: 'Region' },
    { key: 'updated_at', label: 'Updated', render: (row) => <span className="text-text-muted text-xs">{formatDate(row.updated_at)}</span> },
  ]

  const prospectColumns = [
    ...baseColumns.slice(0, 2),
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
    { key: 'current_org', label: 'Org' },
    ...baseColumns.slice(2),
  ]

  const columns = tab === 'prospect' ? prospectColumns : baseColumns

  return (
    <div>
      <button
        onClick={() => navigate('/games')}
        className="text-sm text-text-secondary hover:text-neon cursor-pointer bg-transparent border-none mb-4"
      >
        &larr; Back to Games
      </button>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{game.name}</h1>
          <p className="text-sm text-text-secondary mt-1">
            {roster.length} partner{roster.length !== 1 ? 's' : ''} · {prospects.length} prospect{prospects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => navigate('/players/new')}
          className="px-4 py-2 bg-neon text-bg-primary font-semibold rounded-lg hover:opacity-90 transition-opacity cursor-pointer border-none text-sm"
        >
          + Add Player
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-bg-card border border-border rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('roster')}
          className={`px-4 py-2 text-sm rounded-md cursor-pointer border-none transition-colors ${
            tab === 'roster' ? 'bg-neon/10 text-neon font-medium' : 'bg-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Partners ({roster.length})
        </button>
        <button
          onClick={() => setTab('prospect')}
          className={`px-4 py-2 text-sm rounded-md cursor-pointer border-none transition-colors ${
            tab === 'prospect' ? 'bg-neon/10 text-neon font-medium' : 'bg-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Prospects ({prospects.length})
        </button>
      </div>

      <DataTable
        columns={columns}
        data={current}
        onRowClick={(row) => navigate(`/players/${row.id}`)}
        emptyMessage={tab === 'roster' ? 'No partners for this game yet.' : 'No prospects for this game yet.'}
      />
    </div>
  )
}
