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
  loading?: boolean
}

export default function ClientForm({ initial, onSubmit, onCancel, loading = false }: ClientFormProps) {
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
    } else if (!phone.trim().startsWith('+91')) {
      newErrors.phone = 'Phone number must include country code (start with +91). Example: +919823860000'
    } else if (phone.trim().length !== 13) {
      newErrors.phone = 'Phone number must be exactly 12 digits plus the + sign (e.g., +919823860000).'
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
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-ink-secondary hover:text-ink rounded-lg hover:bg-surface-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {initial ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            initial ? 'Update' : 'Create'
          )}
        </button>
      </div>
    </form>
  )
}
