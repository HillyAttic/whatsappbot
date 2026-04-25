'use client'

import { useState, FormEvent } from 'react'
import { normalizePhone } from '@/lib/phone'

interface ClientRecord {
  id: string
  name: string
  phones: string[]
  gstNumber?: string
}

interface ClientFormProps {
  initial?: ClientRecord
  onSubmit: (data: { name: string; phones: string[]; gstNumber?: string }) => void
  onCancel: () => void
  loading?: boolean
}

export default function ClientForm({ initial, onSubmit, onCancel, loading = false }: ClientFormProps) {
  const [name, setName] = useState(initial?.name || '')
  const [phones, setPhones] = useState<string[]>(initial?.phones || [''])
  const [gstNumber, setGstNumber] = useState(initial?.gstNumber || '')
  const [errors, setErrors] = useState<{ name?: string; phones?: string[]; gstNumber?: string }>({})

  const handlePhoneChange = (index: number, value: string) => {
    let processedValue = value.trim()

    // Strip leading + if present
    if (processedValue.startsWith('+')) {
      processedValue = processedValue.substring(1)
    }

    // If user enters exactly 10 digits without 91, auto-add it
    if (/^\d{10}$/.test(processedValue)) {
      processedValue = '91' + processedValue
    }

    const newPhones = [...phones]
    newPhones[index] = processedValue
    setPhones(newPhones)
  }

  const addPhoneField = () => {
    if (phones.length < 5) {
      setPhones([...phones, ''])
    }
  }

  const removePhoneField = (index: number) => {
    if (phones.length > 1) {
      const newPhones = phones.filter((_, i) => i !== index)
      setPhones(newPhones)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const newErrors: { name?: string; phones?: string[]; gstNumber?: string } = {}

    if (!name.trim()) {
      newErrors.name = 'Name is required.'
    }

    // Filter out empty phone fields
    const filledPhones = phones.filter(p => p.trim())

    if (filledPhones.length === 0) {
      newErrors.phones = ['At least one phone number is required']
    } else {
      const phoneErrors: string[] = []
      const seenPhones = new Set<string>()

      filledPhones.forEach((phone, index) => {
        let trimmed = phone.trim()

        // Strip leading + for validation
        if (trimmed.startsWith('+')) {
          trimmed = trimmed.substring(1)
        }

        if (!trimmed.startsWith('91')) {
          phoneErrors[index] = 'Phone number must include country code (start with 91)'
        } else if (trimmed.length !== 12) {
          phoneErrors[index] = 'Phone number must be exactly 12 digits (91 + 10 digits)'
        } else if (seenPhones.has(trimmed)) {
          phoneErrors[index] = 'This phone number is already added'
        } else {
          seenPhones.add(trimmed)
        }
      })

      if (phoneErrors.length > 0) {
        newErrors.phones = phoneErrors
      }
    }

    // Validate GST number if provided
    if (gstNumber.trim()) {
      const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
      if (gstNumber.trim().length !== 15) {
        newErrors.gstNumber = 'GST number must be exactly 15 characters'
      } else if (!gstPattern.test(gstNumber.trim().toUpperCase())) {
        newErrors.gstNumber = 'Invalid GST format (e.g., 22AAAAA0000A1Z5)'
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const normalizedPhones = filledPhones.map(p => normalizePhone(p))
    onSubmit({
      name: name.trim(),
      phones: normalizedPhones,
      gstNumber: gstNumber.trim().toUpperCase() || undefined
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="client-name" className="eyebrow block mb-2">Full Name</label>
        <input
          type="text"
          id="client-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter client name"
          className="w-full px-4 py-3 bg-surface border-2 border-ink/10 rounded-none text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-all"
        />
        {errors.name && <p className="text-danger text-xs mt-1.5 font-medium">{errors.name}</p>}
      </div>

      <div>
        <label className="eyebrow block mb-2">Phone Numbers</label>
        <div className="space-y-3">
          {phones.map((phone, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => handlePhoneChange(index, e.target.value)}
                  placeholder="919823860000 or 9823860000"
                  className="w-full px-4 py-3 bg-surface border-2 border-ink/10 rounded-none text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-all font-mono"
                />
                {errors.phones?.[index] && errors.phones[index] !== 'At least one phone number is required' && (
                  <p className="text-danger text-xs mt-1.5 font-medium">{errors.phones[index]}</p>
                )}
              </div>
              {phones.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePhoneField(index)}
                  className="px-3 py-3 text-danger hover:bg-danger/10 border-2 border-ink/10 hover:border-danger/30 rounded-none transition-colors"
                  title="Remove phone number"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
        {phones.length < 5 && (
          <button
            type="button"
            onClick={addPhoneField}
            className="mt-3 px-4 py-2 text-xs font-medium text-accent hover:text-accent-hover border border-accent/30 hover:border-accent rounded-none transition-colors flex items-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Phone Number
          </button>
        )}
        {errors.phones?.[0] && typeof errors.phones[0] === 'string' && errors.phones[0] === 'At least one phone number is required' && (
          <p className="text-danger text-xs mt-1.5 font-medium">{errors.phones[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="client-gst" className="eyebrow block mb-2">GST Number (Optional)</label>
        <input
          type="text"
          id="client-gst"
          value={gstNumber}
          onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
          placeholder="22AAAAA0000A1Z5"
          maxLength={15}
          className="w-full px-4 py-3 bg-surface border-2 border-ink/10 rounded-none text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-all font-mono uppercase"
        />
        {errors.gstNumber && <p className="text-danger text-xs mt-1.5 font-medium">{errors.gstNumber}</p>}
        <p className="text-ink-muted text-xs mt-1.5">Format: 2-digit state + 10-char PAN + entity + Z + check digit</p>
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-ink/5">
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
          disabled={loading}
          className="px-6 py-2.5 text-sm font-bold uppercase tracking-wider bg-accent text-white rounded-none hover:bg-accent-hover transition-colors shadow-bold hover:shadow-glow-accent disabled:opacity-70 flex items-center gap-2 border-2 border-transparent"
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
