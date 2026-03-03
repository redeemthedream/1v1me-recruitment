import { useState } from 'react'
import { useTags } from '../hooks/useTags'
import { useToast } from '../components/shared/Toast'
import Modal from '../components/shared/Modal'

const PRESET_COLORS = [
  '#00f0ff', '#b44aff', '#22c55e', '#f59e0b', '#ef4444',
  '#3b82f6', '#ec4899', '#14b8a6', '#f97316', '#8b5cf6',
]

export default function TagsPage() {
  const { tags, loading, createTag, updateTag, deleteTag } = useTags()
  const toast = useToast()
  const [showModal, setShowModal] = useState(false)
  const [editingTag, setEditingTag] = useState(null)
  const [form, setForm] = useState({ name: '', color: '#00f0ff' })

  function openNew() {
    setForm({ name: '', color: '#00f0ff' })
    setEditingTag(null)
    setShowModal(true)
  }

  function openEdit(tag) {
    setForm({ name: tag.name, color: tag.color })
    setEditingTag(tag)
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) { toast('Tag name is required', 'error'); return }
    if (editingTag) {
      const { error } = await updateTag(editingTag.id, form)
      if (error) { toast(error.message, 'error'); return }
      toast('Tag updated')
    } else {
      const { error } = await createTag(form)
      if (error) { toast(error.message, 'error'); return }
      toast('Tag created')
    }
    setShowModal(false)
  }

  async function handleDelete(tag) {
    if (!confirm(`Delete tag "${tag.name}"?`)) return
    const { error } = await deleteTag(tag.id)
    if (error) toast(error.message, 'error')
    else toast('Tag deleted')
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-text-muted">Loading tags...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tags</h1>
          <p className="text-sm text-text-secondary mt-1">Custom categorization labels for players</p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2 bg-neon text-bg-primary font-semibold rounded-lg hover:opacity-90 transition-opacity cursor-pointer border-none text-sm"
        >
          + Create Tag
        </button>
      </div>

      {tags.length === 0 ? (
        <div className="text-center py-16 text-text-muted">No tags yet. Create your first tag to categorize players.</div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {tags.map(tag => (
            <div
              key={tag.id}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-bg-card"
              style={{ borderColor: `${tag.color}30` }}
            >
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
              <span className="font-medium" style={{ color: tag.color }}>{tag.name}</span>
              <button
                onClick={() => openEdit(tag)}
                className="text-xs text-text-muted hover:text-text-primary cursor-pointer bg-transparent border-none ml-2"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(tag)}
                className="text-xs text-text-muted hover:text-danger cursor-pointer bg-transparent border-none"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editingTag ? 'Edit Tag' : 'Create Tag'} onClose={() => setShowModal(false)}>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">Tag Name</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full"
                placeholder="e.g. Rising Star"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1.5">Color</label>
              <div className="flex gap-2 flex-wrap mb-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={`w-8 h-8 rounded-lg cursor-pointer border-2 transition-colors ${
                      form.color === c ? 'border-white' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={form.color}
                onChange={e => setForm({ ...form, color: e.target.value })}
                className="w-full h-8 cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-text-secondary">Preview:</span>
              <span
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: `${form.color}20`,
                  color: form.color,
                  border: `1px solid ${form.color}40`,
                }}
              >
                {form.name || 'Tag Name'}
              </span>
            </div>
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
                {editingTag ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
