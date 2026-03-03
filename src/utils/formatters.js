export function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const date = new Date(dateStr)
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(dateStr)
}

export function formatNumber(num) {
  if (num == null) return '-'
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
  return num.toString()
}

export function formatStatValue(value, type) {
  if (value == null || value === '') return '-'
  if (type === 'percentage') return `${value}%`
  if (type === 'number') return typeof value === 'number' ? value.toLocaleString() : value
  return value
}

export function tierLabel(tier) {
  if (tier === 1) return 'T1'
  if (tier === 2) return 'T2'
  if (tier === 3) return 'T3'
  return '-'
}
