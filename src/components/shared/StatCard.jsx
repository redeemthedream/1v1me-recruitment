export default function StatCard({ label, value, icon, color = 'var(--color-neon)' }) {
  return (
    <div className="bg-bg-card border border-border rounded-xl p-4 flex items-center gap-4">
      {icon && (
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          <span style={{ color }}>{icon}</span>
        </div>
      )}
      <div>
        <div className="text-2xl font-bold" style={{ color }}>{value}</div>
        <div className="text-xs text-text-secondary mt-0.5">{label}</div>
      </div>
    </div>
  )
}
