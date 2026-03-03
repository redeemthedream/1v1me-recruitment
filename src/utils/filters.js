export function applyFilters(players, filters) {
  return players.filter(p => {
    if (filters.search) {
      const q = filters.search.toLowerCase()
      const match = p.ign?.toLowerCase().includes(q) ||
        p.real_name?.toLowerCase().includes(q) ||
        p.current_org?.toLowerCase().includes(q)
      if (!match) return false
    }
    if (filters.game_id && p.game_id !== filters.game_id) return false
    if (filters.tier && p.tier !== Number(filters.tier)) return false
    if (filters.platform && p.platform !== filters.platform) return false
    if (filters.region && p.region !== filters.region) return false
    if (filters.player_status && p.player_status !== filters.player_status) return false
    if (filters.recruitment_status && p.recruitment_status !== filters.recruitment_status) return false
    if (filters.priority && p.priority !== filters.priority) return false
    if (filters.has_contract !== undefined && filters.has_contract !== '' && p.has_contract !== (filters.has_contract === 'true')) return false
    return true
  })
}

export function sortPlayers(players, sortKey, sortDir) {
  if (!sortKey) return players
  return [...players].sort((a, b) => {
    let aVal = a[sortKey]
    let bVal = b[sortKey]
    if (aVal == null) return 1
    if (bVal == null) return -1
    if (typeof aVal === 'string') aVal = aVal.toLowerCase()
    if (typeof bVal === 'string') bVal = bVal.toLowerCase()
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
    return 0
  })
}
