import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useTags() {
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTags = useCallback(async () => {
    const { data } = await supabase.from('tags').select('*').order('name')
    setTags(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchTags() }, [fetchTags])

  async function createTag(tag) {
    const { data, error } = await supabase.from('tags').insert(tag).select().single()
    if (error) return { error }
    await fetchTags()
    return { data }
  }

  async function updateTag(id, updates) {
    const { data, error } = await supabase.from('tags').update(updates).eq('id', id).select().single()
    if (error) return { error }
    await fetchTags()
    return { data }
  }

  async function deleteTag(id) {
    const { error } = await supabase.from('tags').delete().eq('id', id)
    if (error) return { error }
    await fetchTags()
    return {}
  }

  async function getPlayerTags(playerId) {
    const { data } = await supabase
      .from('player_tags')
      .select('tag_id, tags(*)')
      .eq('player_id', playerId)
    return (data || []).map(pt => pt.tags)
  }

  async function setPlayerTags(playerId, tagIds) {
    await supabase.from('player_tags').delete().eq('player_id', playerId)
    if (tagIds.length > 0) {
      await supabase.from('player_tags').insert(
        tagIds.map(tag_id => ({ player_id: playerId, tag_id }))
      )
    }
  }

  return { tags, loading, createTag, updateTag, deleteTag, getPlayerTags, setPlayerTags, refetch: fetchTags }
}
