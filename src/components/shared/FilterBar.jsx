import { TIERS, PLATFORMS, REGIONS, PLAYER_STATUSES, RECRUITMENT_STATUSES, PRIORITIES } from '../../constants/statusOptions'

export default function FilterBar({ filters, onChange, games = [], showRecruitment = false }) {
  const update = (key, value) => onChange({ ...filters, [key]: value })

  return (
    <div className="flex flex-wrap gap-3 items-center">
      <input
        type="text"
        placeholder="Search IGN, name, org..."
        value={filters.search || ''}
        onChange={e => update('search', e.target.value)}
        className="w-56"
      />
      <select value={filters.game_id || ''} onChange={e => update('game_id', e.target.value)}>
        <option value="">All Games</option>
        {games.map(g => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>
      <select value={filters.tier || ''} onChange={e => update('tier', e.target.value)}>
        <option value="">All Tiers</option>
        {TIERS.map(t => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
      <select value={filters.platform || ''} onChange={e => update('platform', e.target.value)}>
        <option value="">All Platforms</option>
        {PLATFORMS.map(p => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <select value={filters.region || ''} onChange={e => update('region', e.target.value)}>
        <option value="">All Regions</option>
        {REGIONS.map(r => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>
      <select value={filters.player_status || ''} onChange={e => update('player_status', e.target.value)}>
        <option value="">All Statuses</option>
        {PLAYER_STATUSES.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>
      {showRecruitment && (
        <>
          <select value={filters.recruitment_status || ''} onChange={e => update('recruitment_status', e.target.value)}>
            <option value="">All Recruitment</option>
            {RECRUITMENT_STATUSES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select value={filters.priority || ''} onChange={e => update('priority', e.target.value)}>
            <option value="">All Priorities</option>
            {PRIORITIES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </>
      )}
      {Object.values(filters).some(v => v) && (
        <button
          onClick={() => onChange({})}
          className="text-xs text-text-muted hover:text-neon transition-colors cursor-pointer bg-transparent border-none"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
