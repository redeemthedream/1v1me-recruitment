import { useNavigate } from 'react-router-dom'
import { usePlayers } from '../hooks/usePlayers'
import { useGames } from '../hooks/useGames'
import { useActivityLog } from '../hooks/useActivityLog'
import StatCard from '../components/shared/StatCard'
import Badge from '../components/shared/Badge'
import TierBadge from '../components/players/TierBadge'
import { RECRUITMENT_STATUSES, TIERS } from '../constants/statusOptions'
import { formatRelativeTime } from '../utils/formatters'

export default function DashboardPage() {
  const { players, loading } = usePlayers()
  const { games } = useGames()
  const { activities } = useActivityLog(null, null, 20)
  const navigate = useNavigate()

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-text-muted">Loading dashboard...</div>
  }

  const roster = players.filter(p => p.category === 'roster')
  const prospects = players.filter(p => p.category === 'prospect')
  const highPriority = prospects.filter(p => p.priority === 'high')
  const freeAgents = players.filter(p => p.player_status === 'free_agent')

  const byGame = games.map(g => ({
    game: g,
    count: players.filter(p => p.game_id === g.id).length,
  })).filter(x => x.count > 0).sort((a, b) => b.count - a.count)

  const byTier = TIERS.map(t => ({
    tier: t,
    count: players.filter(p => p.tier === t.value).length,
  }))

  const pipeline = RECRUITMENT_STATUSES.map(s => ({
    status: s,
    count: prospects.filter(p => p.recruitment_status === s.value).length,
  }))

  const recentPlayers = [...players].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Partners"
          value={roster.length}
          color="var(--color-neon)"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
        />
        <StatCard
          label="Total Prospects"
          value={prospects.length}
          color="var(--color-purple)"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>}
        />
        <StatCard
          label="High Priority"
          value={highPriority.length}
          color="var(--color-danger)"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
        />
        <StatCard
          label="Free Agents"
          value={freeAgents.length}
          color="var(--color-success)"
          icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* Recruitment Pipeline */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Recruitment Pipeline</h2>
            <div className="flex gap-2">
              {pipeline.map(p => (
                <div key={p.status.value} className="flex-1 text-center">
                  <div className="text-2xl font-bold" style={{ color: p.status.color }}>{p.count}</div>
                  <div className="text-[10px] text-text-muted mt-1 uppercase">{p.status.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Players by Game */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Players by Game</h2>
            {byGame.length === 0 ? (
              <p className="text-text-muted text-sm">No players yet</p>
            ) : (
              <div className="flex flex-col gap-2">
                {byGame.map(x => (
                  <div key={x.game.id} className="flex items-center justify-between">
                    <span className="text-sm">{x.game.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-bg-hover rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (x.count / Math.max(...byGame.map(g => g.count))) * 100)}%`,
                            backgroundColor: 'var(--color-neon)',
                          }}
                        />
                      </div>
                      <span className="text-sm text-text-secondary w-8 text-right">{x.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* By Tier */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Players by Tier</h2>
            <div className="flex gap-6">
              {byTier.map(x => (
                <div key={x.tier.value} className="text-center">
                  <div className="text-3xl font-bold" style={{ color: x.tier.color }}>{x.count}</div>
                  <div className="text-xs text-text-muted mt-1">{x.tier.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Recent Players */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Recent Additions</h2>
            {recentPlayers.length === 0 ? (
              <p className="text-text-muted text-sm">No players yet</p>
            ) : (
              <div className="flex flex-col gap-3">
                {recentPlayers.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 cursor-pointer hover:bg-bg-hover rounded-lg p-2 -mx-2 transition-colors"
                    onClick={() => navigate(`/players/${p.id}`)}
                  >
                    <div className="w-8 h-8 rounded-full bg-bg-hover flex items-center justify-center text-xs font-bold text-neon shrink-0">
                      {p.ign?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.ign}</div>
                      <div className="text-xs text-text-muted">{p.game?.short_name} · {p.category === 'roster' ? 'Partner' : p.category}</div>
                    </div>
                    <TierBadge tier={p.tier} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Feed */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-4">Recent Activity</h2>
            {activities.length === 0 ? (
              <p className="text-text-muted text-sm">No activity yet</p>
            ) : (
              <div className="flex flex-col gap-2">
                {activities.slice(0, 10).map(a => (
                  <div key={a.id} className="flex items-start gap-2 text-xs">
                    <span className="text-text-muted shrink-0">{formatRelativeTime(a.created_at)}</span>
                    <span className="text-text-secondary">
                      <span className="text-text-primary">{a.user?.display_name || 'System'}</span>{' '}
                      {a.action} {a.entity_type}{' '}
                      {a.entity_name && <span className="text-neon">{a.entity_name}</span>}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
