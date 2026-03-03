import { TIERS, PRIORITIES, RECRUITMENT_STATUSES } from '../../constants/statusOptions'

export default function BulkActionsBar({ count, onAction, onClear }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-neon/5 border border-neon/20 rounded-xl mb-4">
      <span className="text-sm font-medium text-neon">{count} selected</span>
      <div className="h-4 w-px bg-border" />

      <select
        onChange={e => { if (e.target.value) onAction('tier', Number(e.target.value)); e.target.value = '' }}
        className="text-xs py-1"
        defaultValue=""
      >
        <option value="" disabled>Set Tier</option>
        {TIERS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>

      <select
        onChange={e => { if (e.target.value) onAction('priority', e.target.value); e.target.value = '' }}
        className="text-xs py-1"
        defaultValue=""
      >
        <option value="" disabled>Set Priority</option>
        {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>

      <select
        onChange={e => { if (e.target.value) onAction('recruitment_status', e.target.value); e.target.value = '' }}
        className="text-xs py-1"
        defaultValue=""
      >
        <option value="" disabled>Set Recruitment</option>
        {RECRUITMENT_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>

      <button
        onClick={() => onAction('export')}
        className="text-xs text-text-secondary hover:text-neon cursor-pointer bg-transparent border-none"
      >
        Export CSV
      </button>

      <button
        onClick={() => onAction('delete')}
        className="text-xs text-danger hover:text-danger/80 cursor-pointer bg-transparent border-none"
      >
        Delete
      </button>

      <div className="flex-1" />
      <button
        onClick={onClear}
        className="text-xs text-text-muted hover:text-text-primary cursor-pointer bg-transparent border-none"
      >
        Clear selection
      </button>
    </div>
  )
}
