'use client'

import { useState, FormEvent } from 'react'

interface DocumentRecord {
  id: string
  phone: string
  title: string
  filePath: string
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

    // File is required only when creating a new document
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
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
          File {initial && '(optional - leave empty to keep existing file)'}
        </label>
        <input
          type="file"
          id="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.file && <p className="text-red-600 text-sm mt-1">{errors.file}</p>}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {initial ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}
