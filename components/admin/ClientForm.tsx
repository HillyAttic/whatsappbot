'use client'

import { useState, FormEvent } from 'react'
import { normalizePhone } from '@/lib/phone'

interface ClientRecord {
  id: string
  name: string
  phone: string
}

interface ClientFormProps {
  initial?: ClientRecord
  onSubmit: (data: { name: string; phone: string }) => void
  onCancel: () => void
}

export default function ClientForm({ initial, onSubmit, onCancel }: ClientFormProps) {
  const [name, setName] = useState(initial?.name || '')
  const [phone, setPhone] = useState(initial?.phone || '')
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({})

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const newErrors: { name?: string; phone?: string } = {}

    if (!name.trim()) {
      newErrors.name = 'Name is required.'
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const normalizedPhone = normalizePhone(phone)
    onSubmit({ name: name.trim(), phone: normalizedPhone })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="client-name" className="block text-sm font-medium text-ink mb-1.5">
          Name
        </label>
        <input
          type="text"
          id="client-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter client name"
          className="w-full px-3.5 py-2.5 bg-surface border border-surface-border rounded-lg text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
        />
        {errors.name && <p className="text-danger text-xs mt-1.5 font-medium">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="client-phone" className="block text-sm font-medium text-ink mb-1.5">
          Phone Number
        </label>
        <input
          type="text"
          id="client-phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. +1234567890"
          className="w-full px-3.5 py-2.5 bg-surface border border-surface-border rounded-lg text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all font-mono"
        />
        {errors.phone && <p className="text-danger text-xs mt-1.5 font-medium">{errors.phone}</p>}
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
          {initial ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  )
}
