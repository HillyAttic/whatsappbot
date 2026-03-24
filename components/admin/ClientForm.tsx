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
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <input
          type="text"
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
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
