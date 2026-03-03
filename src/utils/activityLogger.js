import { supabase } from '../lib/supabase'

export async function logActivity({ action, entityType, entityId, entityName, details }) {
  await supabase.from('activity_log').insert({
    user_id: null,
    action,
    entity_type: entityType,
    entity_id: entityId,
    entity_name: entityName,
    details,
  })
}
