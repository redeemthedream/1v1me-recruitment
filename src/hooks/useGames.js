import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { logActivity } from '../utils/activityLogger'

export function useGames() {
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchGames = useCallback(async () => {
    const { data } = await supabase
      .from('games')
      .select('*')
      .order('name')
    setGames(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchGames() }, [fetchGames])

  async function createGame(game) {
    const { data, error } = await supabase.from('games').insert(game).select().single()
    if (error) return { error }
    await logActivity({ action: 'created', entityType: 'game', entityId: data.id, entityName: data.name })
    await fetchGames()
    return { data }
  }

  async function updateGame(id, updates) {
    const { data, error } = await supabase.from('games').update(updates).eq('id', id).select().single()
    if (error) return { error }
    await logActivity({ action: 'updated', entityType: 'game', entityId: data.id, entityName: data.name })
    await fetchGames()
    return { data }
  }

  async function deleteGame(id) {
    const game = games.find(g => g.id === id)
    const { error } = await supabase.from('games').delete().eq('id', id)
    if (error) return { error }
    if (game) await logActivity({ action: 'deleted', entityType: 'game', entityId: id, entityName: game.name })
    await fetchGames()
    return {}
  }

  return { games, loading, createGame, updateGame, deleteGame, refetch: fetchGames }
}
