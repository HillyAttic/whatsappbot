'use client'

import { useState, FormEvent } from 'react'

interface DocumentRecord {
  id: string
  phone?: string
  title: string
  filePath: string
  uploadedAt?: string
}

interface DocumentFormProps {
  initial?: DocumentRecord
  onSubmit: (data: { title: string; file: File | null }) => void
  onCancel: () => void
}

export default function DocumentForm({ initial, onSubmit, onCancel }: DocumentFormProps) {
  const [title, setTitle] = useState(initial?.title || '')
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<{ title?: string; file?: string }>({})

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const newErrors: { title?: string; file?: string } = {}

    if (!title.trim()) {
      newErrors.title = 'Title is required.'
    }

    if (!initial && !file) {
      newErrors.file = 'File is required.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit({ title: title.trim(), file })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="doc-title" className="block text-sm font-medium text-ink mb-1.5">
          Title
        </label>
        <input
          type="text"
          id="doc-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter document title"
          className="w-full px-3.5 py-2.5 bg-surface border border-surface-border rounded-lg text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
        />
        {errors.title && <p className="text-danger text-xs mt-1.5 font-medium">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="doc-file" className="block text-sm font-medium text-ink mb-1.5">
          File {initial && <span className="text-ink-muted font-normal">(leave empty to keep existing)</span>}
        </label>
        <div className="relative">
          <input
            type="file"
            id="doc-file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full px-3.5 py-2.5 bg-surface border border-surface-border rounded-lg text-sm text-ink file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-accent-muted file:text-accent hover:file:bg-accent/20 file:cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          />
        </div>
        {errors.file && <p className="text-danger text-xs mt-1.5 font-medium">{errors.file}</p>}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-ink-secondary hover:text-ink rounded-lg hover:bg-surface-hover transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors shadow-sm"
        >
          {initial ? 'Update' : 'Upload'}
        </button>
      </div>
    </form>
  )
}
