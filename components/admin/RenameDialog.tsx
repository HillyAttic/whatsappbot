'use client'

import { useState, FormEvent } from 'react'

interface RenameDialogProps {
  title: string
  currentName: string
  onConfirm: (newName: string) => void
  onCancel: () => void
  loading?: boolean
}

export default function RenameDialog({ title, currentName, onConfirm, onCancel, loading = false }: RenameDialogProps) {
  const [newName, setNewName] = useState(currentName)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (newName.trim() && newName !== currentName) {
      onConfirm(newName.trim())
    }
  }

  return (
    <div
      className="fixed inset-0 bg-ink/50 modal-backdrop flex items-center justify-center z-50 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="bg-white border-2 border-ink/10 shadow-modal animate-scale-in max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="px-6 py-4 border-b-2 border-accent/20 bg-accent/5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-none bg-accent/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-ink uppercase tracking-wide">{title}</h4>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5">
            <label className="block text-xs font-bold text-ink-secondary uppercase tracking-wide mb-2">
              New Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 border-2 border-ink/10 rounded-none focus:border-accent focus:outline-none text-sm text-ink"
              autoFocus
              disabled={loading}
            />
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t-2 border-ink/8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-ink-secondary hover:text-ink rounded-none hover:bg-surface-hover transition-colors border border-ink/10 hover:border-ink/20 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !newName.trim() || newName === currentName}
              className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider bg-accent text-white rounded-none hover:bg-accent-hover transition-colors shadow-bold border-2 border-transparent disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Renaming...
                </>
              ) : (
                'Rename'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
