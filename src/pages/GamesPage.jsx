import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGames } from '../hooks/useGames'
import { usePlayers } from '../hooks/usePlayers'
import Modal from '../components/shared/Modal'
import { useToast } from '../components/shared/Toast'

const STAT_TYPES = ['number', 'text', 'rank', 'percentage']

function StatFieldEditor({ fields, onChange }) {
  function addField() {
    onChange([...fields, { key: '', label: '', type: 'number' }])
  }

  function updateField(idx, key, value) {
    const updated = fields.map((f, i) => (i === idx ? { ...f, [key]: value } : f))
    onChange(updated)
  }

  function removeField(idx) {
    onChange(fields.filter((_, i) => i !== idx))
  }

  return (
    <div>
      <label className="block text-xs text-text-secondary mb-2">Stat Fields</label>
      <div className="flex flex-col gap-2">
        {fields.map((field, idx) => (
          <div key={idx} className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Key (e.g. kd_ratio)"
              value={field.key}
              onChange={e => updateField(idx, 'key', e.target.value)}
              className="flex-1"
            />
            <input
              type="text"
              placeholder="Label (e.g. K/D Ratio)"
              value={field.label}
              onChange={e => updateField(idx, 'label', e.target.value)}
              className="flex-1"
            />
            <select
              value={field.type}
              onChange={e => updateField(idx, 'type', e.target.value)}
              className="w-28"
            >
              {STAT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => removeField(idx)}
              className="text-danger hover:text-danger/80 cursor-pointer bg-transparent border-none text-lg"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addField}
        className="mt-2 text-xs text-neon hover:text-neon/80 cursor-pointer bg-transparent border-none"
      >
        + Add stat field
      </button>
    </div>
  )
}

function RoleEditor({ roles, onChange }) {
  const [input, setInput] = useState('')

  function addRole() {
    if (input.trim() && !roles.includes(input.trim())) {
      onChange([...roles, input.trim()])
      setInput('')
    }
  }

  return (
    <div>
      <label className="block text-xs text-text-secondary mb-2">Role Options</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {roles.map(r => (
          <span
            key={r}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-bg-hover text-text-primary text-xs"
          >
            {r}
            <button
              type="button"
              onClick={() => onChange(roles.filter(x => x !== r))}
              className="text-text-muted hover:text-danger cursor-pointer bg-transparent border-none text-xs"
            >
              &times;
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add role..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addRole() } }}
          className="flex-1"
        />
        <button
          type="button"
          onClick={addRole}
          className="px-3 py-1.5 bg-bg-hover text-text-primary rounded-lg text-xs cursor-pointer border border-border hover:border-neon transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  )
}

export default function GamesPage() {
  const { games, loading, createGame, updateGame, deleteGame } = useGames()
  const { players } = usePlayers()
  const toast = useToast()
  const navigate = useNavigate()
  const [editingGame, setEditingGame] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const defaultForm = { name: '', short_name: '', stat_fields: [], role_options: [] }
  const [form, setForm] = useState(defaultForm)

  function openNew() {
    setForm(defaultForm)
    setEditingGame(null)
    setShowModal(true)
  }

  function openEdit(game) {
    setForm({
      name: game.name,
      short_name: game.short_name,
      stat_fields: game.stat_fields || [],
      role_options: game.role_options || [],
    })
    setEditingGame(game)
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim() || !form.short_name.trim()) {
      toast('Name and short name are required', 'error')
      return
    }

    if (editingGame) {
      const { error } = await updateGame(editingGame.id, form)
      if (error) { toast(error.message, 'error'); return }
      toast('Game updated')
    } else {
      const { error } = await createGame(form)
      if (error) { toast(error.message, 'error'); return }
      toast('Game created')
    }
    setShowModal(false)
  }

  async function handleDelete(game) {
    if (!confirm(`Delete ${game.name}? Players linked to this game will lose their game reference.`)) return
    const { error } = await deleteGame(game.id)
    if (error) toast(error.message, 'error')
    else toast('Game deleted')
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-text-muted">Loading games...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Games</h1>
          <p className="text-sm text-text-secondary mt-1">Manage games, stat fields, and role options</p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2 bg-neon text-bg-primary font-semibold rounded-lg hover:opacity-90 transition-opacity cursor-pointer border-none text-sm"
        >
          + Add Game
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {games.map(game => {
          const gamePlayers = players.filter(p => p.game_id === game.id)
          const rosterCount = gamePlayers.filter(p => p.category === 'roster').length
          const prospectCount = gamePlayers.filter(p => p.category === 'prospect').length

          return (
            <div
              key={game.id}
              className="bg-bg-card border border-border rounded-xl p-5 hover:border-neon/50 transition-colors cursor-pointer"
              onClick={() => navigate(`/games/${game.id}`)}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{game.name}</h3>
                  <span className="text-xs text-text-muted">{game.short_name}</span>
                </div>
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => openEdit(game)}
                    className="text-xs text-text-secondary hover:text-neon cursor-pointer bg-transparent border-none"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(game)}
                    className="text-xs text-text-secondary hover:text-danger cursor-pointer bg-transparent border-none"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 bg-bg-secondary rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-neon">{rosterCount}</div>
                  <div className="text-[10px] text-text-muted uppercase mt-0.5">Partners</div>
                </div>
                <div className="flex-1 bg-bg-secondary rounded-lg p-3 text-center">
                  <div className="text-xl font-bold text-purple">{prospectCount}</div>
                  <div className="text-[10px] text-text-muted uppercase mt-0.5">Prospects</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {games.length === 0 && (
        <div className="text-center py-16 text-text-muted">
          No games configured yet. Add your first game to get started.
        </div>
      )}

      {showModal && (
        <Modal
          title={editingGame ? `Edit ${editingGame.name}` : 'Add New Game'}
          onClose={() => setShowModal(false)}
          width="max-w-2xl"
        >
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-text-secondary mb-1.5">Game Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Valorant"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1.5">Short Name</label>
                <input
                  type="text"
                  value={form.short_name}
                  onChange={e => setForm({ ...form, short_name: e.target.value })}
                  placeholder="e.g. VAL"
                  className="w-full"
                />
              </div>
            </div>

            <StatFieldEditor
              fields={form.stat_fields}
              onChange={stat_fields => setForm({ ...form, stat_fields })}
            />

            <RoleEditor
              roles={form.role_options}
              onChange={role_options => setForm({ ...form, role_options })}
            />

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary cursor-pointer bg-transparent border border-border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm bg-neon text-bg-primary font-semibold rounded-lg hover:opacity-90 cursor-pointer border-none"
              >
                {editingGame ? 'Save Changes' : 'Create Game'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
