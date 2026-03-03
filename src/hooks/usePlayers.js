import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logActivity } from '../utils/activityLogger'

export function usePlayers(category) {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchPlayers = useCallback(async () => {
    let query = supabase
      .from('players')
      .select('*, game:games(id, name, short_name, stat_fields, role_options)')
      .order('updated_at', { ascending: false })
    if (category) query = query.eq('category', category)
    const { data } = await query
    setPlayers(data || [])
    setLoading(false)
  }, [category])

  useEffect(() => { fetchPlayers() }, [fetchPlayers])

  async function createPlayer(player) {
    const { data, error } = await supabase.from('players').insert(player).select().single()
    if (error) return { error }
    await logActivity({
      action: 'created',
      entityType: 'player',
      entityId: data.id,
      entityName: data.ign,
      details: { category: data.category },
    })
    await fetchPlayers()
    return { data }
  }

  async function updatePlayer(id, updates) {
    const { data, error } = await supabase.from('players').update(updates).eq('id', id).select().single()
    if (error) return { error }
    await logActivity({
      action: 'updated',
      entityType: 'player',
      entityId: data.id,
      entityName: data.ign,
      details: updates,
    })
    await fetchPlayers()
    return { data }
  }

  async function deletePlayer(id) {
    const player = players.find(p => p.id === id)
    const { error } = await supabase.from('players').delete().eq('id', id)
    if (error) return { error }
    if (player) {
      await logActivity({
        action: 'deleted',
        entityType: 'player',
        entityId: id,
        entityName: player.ign,
      })
    }
    await fetchPlayers()
    return {}
  }

  async function bulkUpdate(ids, updates) {
    const { error } = await supabase.from('players').update(updates).in('id', ids)
    if (error) return { error }
    for (const id of ids) {
      const player = players.find(p => p.id === id)
      await logActivity({
        action: 'bulk_updated',
        entityType: 'player',
        entityId: id,
        entityName: player?.ign,
        details: updates,
      })
    }
    await fetchPlayers()
    return {}
  }

  async function bulkDelete(ids) {
    const { error } = await supabase.from('players').delete().in('id', ids)
    if (error) return { error }
    for (const id of ids) {
      const player = players.find(p => p.id === id)
      await logActivity({ action: 'bulk_deleted', entityType: 'player', entityId: id, entityName: player?.ign })
    }
    await fetchPlayers()
    return {}
  }

  return { players, loading, createPlayer, updatePlayer, deletePlayer, bulkUpdate, bulkDelete, refetch: fetchPlayers }
}
