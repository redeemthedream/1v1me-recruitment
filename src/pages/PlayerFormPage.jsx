import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useGames } from '../hooks/useGames'
import { useToast } from '../components/shared/Toast'
import { logActivity } from '../utils/activityLogger'
import {
  TIERS, PLATFORMS, REGIONS, PLAYER_STATUSES,
  RECRUITMENT_STATUSES, PRIORITIES, CATEGORIES,
} from '../constants/statusOptions'

function Section({ title, children }) {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-5 mb-4">
      <h3 className="text-sm font-semibold text-neon uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  )
}

export default function PlayerFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { games } = useGames()
  const toast = useToast()
  const isEdit = !!id

  const [form, setForm] = useState({
    ign: '', real_name: '', avatar_url: '', category: 'prospect',
    game_id: '', platform: '', role: '', region: '',
    age: '', country: '',
    current_org: '', has_contract: false, contract_expiry: '',
    tier: '', player_status: 'active', recruitment_status: 'watching', priority: 'medium',
    twitter_url: '', twitter_followers: '', twitch_url: '', twitch_followers: '',
    youtube_url: '', youtube_followers: '', tiktok_url: '', tiktok_followers: '',
    discord_tag: '', competitive_history: '',
  })
  const [stats, setStats] = useState({})
  const [compHistory, setCompHistory] = useState([])
  const [initialNote, setInitialNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEdit)

  const selectedGame = games.find(g => g.id === form.game_id)

  useEffect(() => {
    if (!isEdit) return
    async function fetchPlayer() {
      const { data: player } = await supabase
        .from('players')
        .select('*')
        .eq('id', id)
        .single()
      if (!player) { navigate('/partners'); return }

      setForm({
        ign: player.ign || '',
        real_name: player.real_name || '',
        avatar_url: player.avatar_url || '',
        category: player.category || 'prospect',
        game_id: player.game_id || '',
        platform: player.platform || '',
        role: player.role || '',
        region: player.region || '',
        age: player.age || '',
        country: player.country || '',
        current_org: player.current_org || '',
        has_contract: player.has_contract || false,
        contract_expiry: player.contract_expiry || '',
        tier: player.tier || '',
        player_status: player.player_status || 'active',
        recruitment_status: player.recruitment_status || 'watching',
        priority: player.priority || 'medium',
        twitter_url: player.twitter_url || '',
        twitter_followers: player.twitter_followers || '',
        twitch_url: player.twitch_url || '',
        twitch_followers: player.twitch_followers || '',
        youtube_url: player.youtube_url || '',
        youtube_followers: player.youtube_followers || '',
        tiktok_url: player.tiktok_url || '',
        tiktok_followers: player.tiktok_followers || '',
        discord_tag: player.discord_tag || '',
        competitive_history: player.competitive_history || '',
      })

      if (player.game_id) {
        const { data: statData } = await supabase
          .from('player_stats')
          .select('*')
          .eq('player_id', id)
          .eq('game_id', player.game_id)
          .single()
        if (statData) setStats(statData.stats || {})
      }

      const { data: compData } = await supabase
        .from('competitive_history')
        .select('*')
        .eq('player_id', id)
        .order('date', { ascending: false })
      setCompHistory(compData || [])

      setFetching(false)
    }
    fetchPlayer()
  }, [id, isEdit, navigate])

  function updateForm(key, value) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.ign.trim()) { toast('IGN is required', 'error'); return }
    setLoading(true)

    const payload = {
      ...form,
      age: form.age ? Number(form.age) : null,
      tier: form.tier ? Number(form.tier) : null,
      twitter_followers: form.twitter_followers ? Number(form.twitter_followers) : null,
      twitch_followers: form.twitch_followers ? Number(form.twitch_followers) : null,
      youtube_followers: form.youtube_followers ? Number(form.youtube_followers) : null,
      tiktok_followers: form.tiktok_followers ? Number(form.tiktok_followers) : null,
      game_id: form.game_id || null,
      contract_expiry: form.contract_expiry || null,
    }

    let playerId = id
    if (isEdit) {
      const { error } = await supabase.from('players').update(payload).eq('id', id)
      if (error) { toast(error.message, 'error'); setLoading(false); return }
      await logActivity({ action: 'updated', entityType: 'player', entityId: id, entityName: form.ign })
    } else {
      // payload.added_by = user?.id
      const { data, error } = await supabase.from('players').insert(payload).select().single()
      if (error) { toast(error.message, 'error'); setLoading(false); return }
      playerId = data.id
      await logActivity({ action: 'created', entityType: 'player', entityId: data.id, entityName: form.ign, details: { category: form.category } })
    }

    // Save stats
    if (form.game_id && Object.keys(stats).length > 0) {
      await supabase.from('player_stats').upsert({
        player_id: playerId,
        game_id: form.game_id,
        stats,
        season: 'current',
      }, { onConflict: 'player_id,game_id,season' })
    }

    // Save competitive history
    if (!isEdit && compHistory.length > 0) {
      await supabase.from('competitive_history').insert(
        compHistory.map(ch => ({ ...ch, player_id: playerId }))
      )
    }

    // Save initial note
    if (!isEdit && initialNote.trim()) {
      await supabase.from('player_notes').insert({
        player_id: playerId,
        author_id: null,
        content: initialNote,
      })
    }

    toast(isEdit ? 'Player updated' : 'Player added')
    navigate(`/players/${playerId}`)
    setLoading(false)
  }

  if (fetching) {
    return <div className="flex items-center justify-center h-64 text-text-muted">Loading player...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{isEdit ? `Edit ${form.ign}` : 'Add New Player'}</h1>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-text-secondary hover:text-text-primary cursor-pointer bg-transparent border-none"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <Section title="Basic Info">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">IGN *</label>
              <input type="text" value={form.ign} onChange={e => updateForm('ign', e.target.value)} className="w-full" required />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">Real Name</label>
              <input type="text" value={form.real_name} onChange={e => updateForm('real_name', e.target.value)} className="w-full" />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">Avatar URL</label>
              <input type="url" value={form.avatar_url} onChange={e => updateForm('avatar_url', e.target.value)} className="w-full" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs text-text-secondary mb-1.5">Category</label>
            <div className="flex gap-3">
              {CATEGORIES.map(c => (
                <label key={c.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value={c.value}
                    checked={form.category === c.value}
                    onChange={e => updateForm('category', e.target.value)}
                    className="accent-[var(--color-neon)]"
                  />
                  <span className="text-sm">{c.label}</span>
                </label>
              ))}
            </div>
          </div>
        </Section>

        {/* Game Info */}
        <Section title="Game Info">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">Game</label>
              <select value={form.game_id} onChange={e => updateForm('game_id', e.target.value)} className="w-full">
                <option value="">Select game...</option>
                {games.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">Platform</label>
              <select value={form.platform} onChange={e => updateForm('platform', e.target.value)} className="w-full">
                <option value="">Select...</option>
                {PLATFORMS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">Role/Position</label>
              {selectedGame?.role_options?.length > 0 ? (
                <select value={form.role} onChange={e => updateForm('role', e.target.value)} className="w-full">
                  <option value="">Select...</option>
                  {selectedGame.role_options.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              ) : (
                <input type="text" value={form.role} onChange={e => updateForm('role', e.target.value)} className="w-full" />
              )}
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">Region</label>
              <select value={form.region} onChange={e => updateForm('region', e.target.value)} className="w-full">
                <option value="">Select...</option>
                {REGIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        </Section>

        {/* Demographics */}
        <Section title="Demographics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">Age</label>
              <input type="number" value={form.age} onChange={e => updateForm('age', e.target.value)} className="w-full" min="13" max="99" />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">Country</label>
              <input type="text" value={form.country} onChange={e => updateForm('country', e.target.value)} className="w-full" />
            </div>
          </div>
        </Section>

        {/* Organization — only for prospects */}
        {form.category === 'prospect' && (
          <Section title="Organization">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-text-secondary mb-1.5">Current Org</label>
                <input type="text" value={form.current_org} onChange={e => updateForm('current_org', e.target.value)} className="w-full" />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1.5">Has Contract</label>
                <div className="flex items-center gap-2 h-[38px]">
                  <input
                    type="checkbox"
                    checked={form.has_contract}
                    onChange={e => updateForm('has_contract', e.target.checked)}
                    className="accent-[var(--color-neon)]"
                  />
                  <span className="text-sm text-text-secondary">Under contract</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1.5">Contract Expiry</label>
                <input type="date" value={form.contract_expiry} onChange={e => updateForm('contract_expiry', e.target.value)} className="w-full" />
              </div>
            </div>
          </Section>
        )}

        {/* Classification — only show scouting fields for prospects */}
        <Section title="Classification">
          <div className={`grid grid-cols-1 ${form.category === 'prospect' ? 'md:grid-cols-4' : 'md:grid-cols-1'} gap-4`}>
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">Tier</label>
              <select value={form.tier} onChange={e => updateForm('tier', e.target.value)} className="w-full">
                <option value="">Select...</option>
                {TIERS.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            {form.category === 'prospect' && (
              <>
                <div>
                  <label className="block text-xs text-text-secondary mb-1.5">Player Status</label>
                  <select value={form.player_status} onChange={e => updateForm('player_status', e.target.value)} className="w-full">
                    {PLAYER_STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1.5">Recruitment Status</label>
                  <select value={form.recruitment_status} onChange={e => updateForm('recruitment_status', e.target.value)} className="w-full">
                    {RECRUITMENT_STATUSES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1.5">Priority</label>
                  <select value={form.priority} onChange={e => updateForm('priority', e.target.value)} className="w-full">
                    {PRIORITIES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </Section>

        {/* Social Media */}
        <Section title="Social Media">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: 'twitter', label: 'Twitter/X' },
              { key: 'twitch', label: 'Twitch' },
              { key: 'youtube', label: 'YouTube' },
              { key: 'tiktok', label: 'TikTok' },
            ].map(s => (
              <div key={s.key} className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs text-text-secondary mb-1.5">{s.label} URL</label>
                  <input
                    type="url"
                    value={form[`${s.key}_url`]}
                    onChange={e => updateForm(`${s.key}_url`, e.target.value)}
                    className="w-full"
                  />
                </div>
                <div className="w-28">
                  <label className="block text-xs text-text-secondary mb-1.5">Followers</label>
                  <input
                    type="number"
                    value={form[`${s.key}_followers`]}
                    onChange={e => updateForm(`${s.key}_followers`, e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            ))}
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">Discord Tag</label>
              <input type="text" value={form.discord_tag} onChange={e => updateForm('discord_tag', e.target.value)} className="w-full" />
            </div>
          </div>
        </Section>

        {/* Game-Specific Stats */}
        {selectedGame && selectedGame.stat_fields?.length > 0 && (
          <Section title={`${selectedGame.name} Stats`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {selectedGame.stat_fields.map(field => (
                <div key={field.key}>
                  <label className="block text-xs text-text-secondary mb-1.5">{field.label}</label>
                  <input
                    type={field.type === 'number' || field.type === 'percentage' ? 'number' : 'text'}
                    value={stats[field.key] || ''}
                    onChange={e => setStats(prev => ({ ...prev, [field.key]: e.target.value }))}
                    step={field.type === 'number' || field.type === 'percentage' ? '0.01' : undefined}
                    className="w-full"
                  />
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Competitive History */}
        <Section title="Competitive History">
          <textarea
            value={form.competitive_history}
            onChange={e => updateForm('competitive_history', e.target.value)}
            placeholder="Free text competitive history..."
            rows={3}
            className="w-full mb-4"
          />

          <div className="text-xs text-text-secondary mb-2">Tournament Results</div>
          {compHistory.map((ch, idx) => (
            <div key={idx} className="flex gap-2 items-center mb-2">
              <input
                type="text"
                placeholder="Tournament"
                value={ch.tournament_name || ''}
                onChange={e => {
                  const updated = [...compHistory]
                  updated[idx] = { ...updated[idx], tournament_name: e.target.value }
                  setCompHistory(updated)
                }}
                className="flex-1"
              />
              <input
                type="text"
                placeholder="Placement"
                value={ch.placement || ''}
                onChange={e => {
                  const updated = [...compHistory]
                  updated[idx] = { ...updated[idx], placement: e.target.value }
                  setCompHistory(updated)
                }}
                className="w-24"
              />
              <input
                type="date"
                value={ch.date || ''}
                onChange={e => {
                  const updated = [...compHistory]
                  updated[idx] = { ...updated[idx], date: e.target.value }
                  setCompHistory(updated)
                }}
                className="w-36"
              />
              <input
                type="text"
                placeholder="Team"
                value={ch.team_name || ''}
                onChange={e => {
                  const updated = [...compHistory]
                  updated[idx] = { ...updated[idx], team_name: e.target.value }
                  setCompHistory(updated)
                }}
                className="w-28"
              />
              <button
                type="button"
                onClick={() => setCompHistory(compHistory.filter((_, i) => i !== idx))}
                className="text-danger hover:text-danger/80 cursor-pointer bg-transparent border-none text-lg"
              >
                &times;
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setCompHistory([...compHistory, { tournament_name: '', placement: '', date: '', team_name: '' }])}
            className="text-xs text-neon hover:text-neon/80 cursor-pointer bg-transparent border-none"
          >
            + Add tournament result
          </button>
        </Section>

        {/* Initial Note (only for new players) */}
        {!isEdit && (
          <Section title="Initial Note">
            <textarea
              value={initialNote}
              onChange={e => setInitialNote(e.target.value)}
              placeholder="Add an initial scouting note..."
              rows={3}
              className="w-full"
            />
          </Section>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 text-sm text-text-secondary hover:text-text-primary cursor-pointer bg-transparent border border-border rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 text-sm bg-neon text-bg-primary font-semibold rounded-lg hover:opacity-90 cursor-pointer border-none disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Player'}
          </button>
        </div>
      </form>
    </div>
  )
}
