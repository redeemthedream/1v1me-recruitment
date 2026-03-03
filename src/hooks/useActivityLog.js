import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useActivityLog(entityType, entityId, limit = 50) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchActivities = useCallback(async () => {
    let query = supabase
      .from('activity_log')
      .select('*, user:profiles(display_name, email)')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (entityType) query = query.eq('entity_type', entityType)
    if (entityId) query = query.eq('entity_id', entityId)

    const { data } = await query
    setActivities(data || [])
    setLoading(false)
  }, [entityType, entityId, limit])

  useEffect(() => { fetchActivities() }, [fetchActivities])

  return { activities, loading, refetch: fetchActivities }
}
