import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { usePlayers } from '../hooks/usePlayers'
import { useGames } from '../hooks/useGames'
import TierBadge from '../components/players/TierBadge'
import Badge from '../components/shared/Badge'
import SocialLinks from '../components/players/SocialLinks'
import { PLAYER_STATUSES, RECRUITMENT_STATUSES, PRIORITIES } from '../constants/statusOptions'
import { formatStatValue } from '../utils/formatters'

function CompareSelector({ players, selected, onChange, slot }) {
  return (
    <select
      value={selected || ''}
      onChange={e => onChange(slot, e.target.value || null)}
      className="w-full"
    >
      <option value="">Select player {slot + 1}...</option>
      {players.map(p => (
        <option key={p.id} value={p.id}>{p.ign} ({p.game?.short_name || 'N/A'})</option>
      ))}
    </select>
  )
}

function CompareCell({ values, type = 'text', higherIsBetter = true }) {
  const numVals = values.map(v => {
    if (v == null || v === '' || v === '-') return null
    const n = parseFloat(v)
    return isNaN(n) ? null : n
  })

  const validNums = numVals.filter(v => v !== null)
  const best = validNums.length > 1
    ? (higherIsBetter ? Math.max(...validNums) : Math.min(...validNums))
    : null

  return values.map((val, i) => {
    const isNumeric = numVals[i] !== null
    const isBest = best !== null && isNumeric && numVals[i] === best
    const isWorst = best !== null && isNumeric && numVals[i] !== best && validNums.length > 1
    return (
      <td
        key={i}
        className={`px-4 py-2.5 text-sm text-center ${
          isBest ? 'text-success font-medium' : isWorst ? 'text-danger/70' : ''
        }`}
      >
        {val ?? '-'}
      </td>
    )
  })
}

export default function ComparePage() {
  const { players } = usePlayers()
  const { games } = useGames()
  const [selectedIds, setSelectedIds] = useState([null, null, null])
  const [playerData, setPlayerData] = useState([])
  const [statsData, setStatsData] = useState([])

  function handleSelect(slot, playerId) {
    const updated = [...selectedIds]
    updated[slot] = playerId
    setSelectedIds(updated)
  }

  useEffect(() => {
    async function fetchSelected() {
      const ids = selectedIds.filter(Boolean)
      if (ids.length === 0) { setPlayerData([]); setStatsData([]); return }

      const { data: pData } = await supabase
        .from('players')
        .select('*, game:games(*)')
        .in('id', ids)

      const { data: sData } = await supabase
        .from('player_stats')
        .select('*')
        .in('player_id', ids)

      setPlayerData(pData || [])
      setStatsData(sData || [])
    }
    fetchSelected()
  }, [selectedIds])

  const orderedPlayers = selectedIds.map(id => playerData.find(p => p?.id === id) || null)
  const activeCount = orderedPlayers.filter(Boolean).length

  // Collect all stat fields across selected players' games
  const allStatFields = []
  const seenKeys = new Set()
  orderedPlayers.forEach(p => {
    if (!p?.game?.stat_fields) return
    for (const f of p.game.stat_fields) {
      if (!seenKeys.has(f.key)) {
        seenKeys.add(f.key)
        allStatFields.push(f)
      }
    }
  })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Compare Players</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[0, 1, 2].map(i => (
          <CompareSelector
            key={i}
            players={players}
            selected={selectedIds[i]}
            onChange={handleSelect}
            slot={i}
          />
        ))}
      </div>

      {activeCount < 2 ? (
        <div className="text-center py-16 text-text-muted">
          Select at least 2 players to compare
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-bg-secondary">
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase w-40">Field</th>
                {orderedPlayers.map((p, i) => (
                  <th key={i} className="px-4 py-3 text-center">
                    {p ? (
                      <div>
                        <div className="font-semibold text-text-primary">{p.ign}</div>
                        <div className="text-xs text-text-muted font-normal">{p.game?.short_name}</div>
                      </div>
                    ) : (
                      <span className="text-text-muted">-</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Basic Info Rows */}
              <tr className="border-t border-border">
                <td className="px-4 py-2.5 text-text-secondary">Tier</td>
                {orderedPlayers.map((p, i) => (
                  <td key={i} className="px-4 py-2.5 text-center">
                    {p ? <TierBadge tier={p.tier} /> : '-'}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-border">
                <td className="px-4 py-2.5 text-text-secondary">Status</td>
                {orderedPlayers.map((p, i) => {
                  const s = p ? PLAYER_STATUSES.find(x => x.value === p.player_status) : null
                  return (
                    <td key={i} className="px-4 py-2.5 text-center">
                      {s ? <Badge label={s.label} color={s.color} /> : '-'}
                    </td>
                  )
                })}
              </tr>
              <tr className="border-t border-border">
                <td className="px-4 py-2.5 text-text-secondary">Role</td>
                <CompareCell values={orderedPlayers.map(p => p?.role)} />
              </tr>
              <tr className="border-t border-border">
                <td className="px-4 py-2.5 text-text-secondary">Region</td>
                <CompareCell values={orderedPlayers.map(p => p?.region)} />
              </tr>
              <tr className="border-t border-border">
                <td className="px-4 py-2.5 text-text-secondary">Age</td>
                <CompareCell values={orderedPlayers.map(p => p?.age)} higherIsBetter={false} />
              </tr>
              <tr className="border-t border-border">
                <td className="px-4 py-2.5 text-text-secondary">Org</td>
                <CompareCell values={orderedPlayers.map(p => p?.current_org)} />
              </tr>
              <tr className="border-t border-border">
                <td className="px-4 py-2.5 text-text-secondary">Platform</td>
                <CompareCell values={orderedPlayers.map(p => p?.platform)} />
              </tr>

              {/* Stat Rows */}
              {allStatFields.length > 0 && (
                <tr className="bg-bg-secondary">
                  <td colSpan={4} className="px-4 py-2 text-xs font-semibold text-neon uppercase tracking-wider">
                    Game Stats
                  </td>
                </tr>
              )}
              {allStatFields.map(field => {
                const vals = orderedPlayers.map(p => {
                  if (!p) return null
                  const ps = statsData.find(s => s.player_id === p.id && s.game_id === p.game_id)
                  return ps?.stats?.[field.key] != null
                    ? formatStatValue(ps.stats[field.key], field.type)
                    : null
                })
                return (
                  <tr key={field.key} className="border-t border-border">
                    <td className="px-4 py-2.5 text-text-secondary">{field.label}</td>
                    <CompareCell
                      values={vals}
                      higherIsBetter={field.key !== 'avg_placement'}
                    />
                  </tr>
                )
              })}

              {/* Social rows */}
              <tr className="bg-bg-secondary">
                <td colSpan={4} className="px-4 py-2 text-xs font-semibold text-neon uppercase tracking-wider">
                  Social Following
                </td>
              </tr>
              {['twitter', 'twitch', 'youtube', 'tiktok'].map(platform => (
                <tr key={platform} className="border-t border-border">
                  <td className="px-4 py-2.5 text-text-secondary capitalize">{platform === 'twitter' ? 'Twitter/X' : platform}</td>
                  <CompareCell
                    values={orderedPlayers.map(p => p?.[`${platform}_followers`])}
                  />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
