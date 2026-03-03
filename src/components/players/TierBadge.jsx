import { TIERS } from '../../constants/statusOptions'

export default function TierBadge({ tier }) {
  const t = TIERS.find(x => x.value === tier)
  if (!t) return <span className="text-text-muted">-</span>
  return (
    <span
      className="inline-flex items-center text-xs font-bold px-2 py-0.5 rounded"
      style={{ color: t.color, backgroundColor: `${t.color}15`, border: `1px solid ${t.color}30` }}
    >
      {t.label}
    </span>
  )
}
