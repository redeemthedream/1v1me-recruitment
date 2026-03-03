import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useGames } from '../hooks/useGames'
import { useTags } from '../hooks/useTags'
import { useActivityLog } from '../hooks/useActivityLog'
import { useToast } from '../components/shared/Toast'
import { logActivity } from '../utils/activityLogger'
import Badge from '../components/shared/Badge'
import TierBadge from '../components/players/TierBadge'
import SocialLinks from '../components/players/SocialLinks'
import { PLAYER_STATUSES, RECRUITMENT_STATUSES, PRIORITIES } from '../constants/statusOptions'
import { formatDate, formatRelativeTime, formatStatValue } from '../utils/formatters'

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between py-2 border-b border-border/50">
      <span className="text-text-secondary text-sm">{label}</span>
      <span className="text-sm font-medium">{value || '-'}</span>
    </div>
  )
}

export default function PlayerDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { games } = useGames()
  const { tags: allTags, getPlayerTags, setPlayerTags } = useTags()
  const { activities } = useActivityLog('player', id, 20)
  const toast = useToast()

  const [player, setPlayer] = useState(null)
  const [stats, setStats] = useState(null)
  const [compHistory, setCompHistory] = useState([])
  const [notes, setNotes] = useState([])
  const [playerTags, setPlayerTagsList] = useState([])
  const [newNote, setNewNote] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [id])

  async function fetchAll() {
    const { data: p } = await supabase
      .from('players')
      .select('*, game:games(*)')
      .eq('id', id)
      .single()
    if (!p) { navigate('/partners'); return }
    setPlayer(p)

    const [statsRes, compRes, notesRes] = await Promise.all([
      p.game_id
        ? supabase.from('player_stats').select('*').eq('player_id', id).eq('game_id', p.game_id).single()
        : { data: null },
      supabase.from('competitive_history').select('*').eq('player_id', id).order('date', { ascending: false }),
      supabase.from('player_notes').select('*, author:profiles(display_name)').eq('player_id', id).order('is_pinned', { ascending: false }).order('created_at', { ascending: false }),
    ])

    setStats(statsRes.data)
    setCompHistory(compRes.data || [])
    setNotes(notesRes.data || [])

    const tags = await getPlayerTags(id)
    setPlayerTagsList(tags)
    setLoading(false)
  }

  async function addNote() {
    if (!newNote.trim()) return
    const { error } = await supabase.from('player_notes').insert({
      player_id: id,
      author_id: null,
      content: newNote,
    })
    if (error) { toast(error.message, 'error'); return }
    await logActivity({ action: 'added_note', entityType: 'player', entityId: id, entityName: player.ign })
    setNewNote('')
    fetchAll()
    toast('Note added')
  }

  async function togglePin(note) {
    await supabase.from('player_notes').update({ is_pinned: !note.is_pinned }).eq('id', note.id)
    fetchAll()
  }

  async function deleteNote(noteId) {
    await supabase.from('player_notes').delete().eq('id', noteId)
    fetchAll()
    toast('Note deleted')
  }

  async function handleTagToggle(tagId) {
    const currentIds = playerTags.map(t => t.id)
    const newIds = currentIds.includes(tagId)
      ? currentIds.filter(x => x !== tagId)
      : [...currentIds, tagId]
    await setPlayerTags(id, newIds)
    const tags = await getPlayerTags(id)
    setPlayerTagsList(tags)
  }

  async function handleDelete() {
    if (!confirm(`Delete ${player.ign}? This cannot be undone.`)) return
    await supabase.from('players').delete().eq('id', id)
    await logActivity({ action: 'deleted', entityType: 'player', entityId: id, entityName: player.ign })
    toast('Player deleted')
    navigate(player.category === 'roster' ? '/partners' : '/prospects')
  }

  if (loading || !player) {
    return <div className="flex items-center justify-center h-64 text-text-muted">Loading player...</div>
  }

  const game = player.game
  const pStatus = PLAYER_STATUSES.find(s => s.value === player.player_status)
  const rStatus = RECRUITMENT_STATUSES.find(s => s.value === player.recruitment_status)
  const priority = PRIORITIES.find(p => p.value === player.priority)

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-bg-card border border-border flex items-center justify-center text-2xl font-bold text-neon overflow-hidden">
            {player.avatar_url ? (
              <img src={player.avatar_url} className="w-full h-full object-cover" alt="" />
            ) : (
              player.ign[0]?.toUpperCase()
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{player.ign}</h1>
              <TierBadge tier={player.tier} />
              {pStatus && <Badge label={pStatus.label} color={pStatus.color} />}
              {player.category === 'prospect' && rStatus && <Badge label={rStatus.label} color={rStatus.color} />}
              {priority && <Badge label={priority.label} color={priority.color} />}
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-text-secondary">
              {player.real_name && <span>{player.real_name}</span>}
              {game && <span>· {game.name}</span>}
              {player.role && <span>· {player.role}</span>}
              {player.platform && <span>· {player.platform}</span>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/players/${id}/edit`)}
            className="px-4 py-2 text-sm bg-bg-card border border-border rounded-lg text-text-primary hover:border-neon cursor-pointer transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 text-sm bg-bg-card border border-danger/30 rounded-lg text-danger hover:bg-danger/10 cursor-pointer transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="xl:col-span-2 flex flex-col gap-6">
          {/* Info Grid */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Player Info</h2>
            <div className="grid grid-cols-2 gap-x-8">
              <InfoRow label="Category" value={player.category} />
              <InfoRow label="Region" value={player.region} />
              <InfoRow label="Age" value={player.age} />
              <InfoRow label="Country" value={player.country} />
              <InfoRow label="Current Org" value={player.current_org} />
              <InfoRow label="Contract" value={player.has_contract ? `Yes${player.contract_expiry ? ` (expires ${formatDate(player.contract_expiry)})` : ''}` : 'No'} />
              <InfoRow label="Added" value={formatDate(player.created_at)} />
              <InfoRow label="Updated" value={formatDate(player.updated_at)} />
            </div>
          </div>

          {/* Socials */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Social Media</h2>
            <SocialLinks player={player} />
          </div>

          {/* Stats */}
          {game && stats?.stats && Object.keys(stats.stats).length > 0 && (
            <div className="bg-bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">{game.name} Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(game.stat_fields || []).map(field => (
                  <div key={field.key} className="bg-bg-secondary rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-neon">
                      {formatStatValue(stats.stats[field.key], field.type)}
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">{field.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Competitive History */}
          {(compHistory.length > 0 || player.competitive_history) && (
            <div className="bg-bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Competitive History</h2>
              {player.competitive_history && (
                <p className="text-sm text-text-secondary mb-4 whitespace-pre-wrap">{player.competitive_history}</p>
              )}
              {compHistory.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-text-muted uppercase">
                        <th className="pb-2 pr-4">Tournament</th>
                        <th className="pb-2 pr-4">Placement</th>
                        <th className="pb-2 pr-4">Date</th>
                        <th className="pb-2 pr-4">Team</th>
                        <th className="pb-2">Prize Pool</th>
                      </tr>
                    </thead>
                    <tbody>
                      {compHistory.map(ch => (
                        <tr key={ch.id} className="border-t border-border/50">
                          <td className="py-2 pr-4">{ch.tournament_name}</td>
                          <td className="py-2 pr-4 text-neon font-medium">{ch.placement}</td>
                          <td className="py-2 pr-4 text-text-secondary">{formatDate(ch.date)}</td>
                          <td className="py-2 pr-4">{ch.team_name || '-'}</td>
                          <td className="py-2">{ch.prize_pool || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Scout Notes</h2>
            <div className="flex gap-2 mb-4">
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Add a note..."
                rows={2}
                className="flex-1"
              />
              <button
                onClick={addNote}
                disabled={!newNote.trim()}
                className="px-4 py-2 bg-neon text-bg-primary font-semibold rounded-lg hover:opacity-90 cursor-pointer border-none text-sm self-end disabled:opacity-50"
              >
                Add
              </button>
            </div>
            {notes.length === 0 ? (
              <p className="text-text-muted text-sm">No notes yet</p>
            ) : (
              <div className="flex flex-col gap-3">
                {notes.map(note => (
                  <div key={note.id} className={`p-3 rounded-lg border ${note.is_pinned ? 'bg-neon/5 border-neon/20' : 'bg-bg-secondary border-border'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {note.is_pinned && <span className="text-neon text-xs">Pinned</span>}
                        <span className="text-xs text-text-secondary">{note.author?.display_name}</span>
                        <span className="text-xs text-text-muted">{formatRelativeTime(note.created_at)}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => togglePin(note)}
                          className="text-xs text-text-muted hover:text-neon cursor-pointer bg-transparent border-none"
                        >
                          {note.is_pinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button
                          onClick={() => deleteNote(note.id)}
                          className="text-xs text-text-muted hover:text-danger cursor-pointer bg-transparent border-none"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="flex flex-col gap-6">
          {/* Tags */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Tags</h2>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map(tag => {
                const active = playerTags.some(t => t.id === tag.id)
                return (
                  <button
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer border transition-colors ${
                      active
                        ? 'border-transparent'
                        : 'bg-transparent border-border text-text-muted hover:border-border-light'
                    }`}
                    style={active ? {
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                      borderColor: `${tag.color}40`,
                    } : {}}
                  >
                    {tag.name}
                  </button>
                )
              })}
              {allTags.length === 0 && (
                <p className="text-text-muted text-xs">No tags created yet</p>
              )}
            </div>
          </div>

          {/* Activity for this player */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider mb-3">Activity</h2>
            {activities.length === 0 ? (
              <p className="text-text-muted text-sm">No activity</p>
            ) : (
              <div className="flex flex-col gap-2">
                {activities.map(a => (
                  <div key={a.id} className="text-xs">
                    <span className="text-text-muted">{formatRelativeTime(a.created_at)}</span>
                    <span className="text-text-secondary ml-1.5">
                      {a.user?.display_name || 'System'} {a.action}
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
