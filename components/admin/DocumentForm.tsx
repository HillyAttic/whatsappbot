'use client'

import { useState, FormEvent } from 'react'
import { CATEGORIES, CATEGORY_NAMES } from '@/lib/document-categories'

interface DocumentRecord {
  id: string
  phone?: string
  title: string
  filePath: string
  uploadedAt?: string
  category?: string
  fiscalYear?: string | null
  subCategory?: string | null
}

interface DocumentFormData {
  title: string
  file: File | null
  category: string
  fiscalYear: string | null
  subCategory: string | null
}

interface UploadPreset {
  category?: string
  fiscalYear?: string | null
  subCategory?: string | null
}

interface DocumentFormProps {
  initial?: DocumentRecord
  preset?: UploadPreset
  onSubmit: (data: DocumentFormData) => void
  onCancel: () => void
}

export default function DocumentForm({ initial, preset, onSubmit, onCancel }: DocumentFormProps) {
  const [title, setTitle] = useState(initial?.title || '')
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState(initial?.category || preset?.category || '')
  const [fiscalYear, setFiscalYear] = useState<string>(initial?.fiscalYear || preset?.fiscalYear || '')
  const [subCategory, setSubCategory] = useState<string>(initial?.subCategory || preset?.subCategory || '')
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})

  const catConfig = category ? CATEGORIES[category] : null

  const handleCategoryChange = (val: string) => {
    setCategory(val)
    setFiscalYear('')
    setSubCategory('')
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const newErrors: Partial<Record<string, string>> = {}

    if (!title.trim()) newErrors.title = 'Title is required.'
    if (!category) newErrors.category = 'Category is required.'
    if (!initial && !file) newErrors.file = 'File is required.'

    if (catConfig) {
      if (catConfig.fiscalYears.length > 0 && !fiscalYear) {
        newErrors.fiscalYear = 'Fiscal year is required.'
      }
      if (catConfig.subCategories.length > 0 && !subCategory) {
        newErrors.subCategory = 'Sub-category is required.'
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit({
      title: title.trim(),
      file,
      category,
      fiscalYear: fiscalYear || null,
      subCategory: subCategory || null,
    })
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
        <label htmlFor="doc-category" className="block text-sm font-medium text-ink mb-1.5">
          Category
        </label>
        <select
          id="doc-category"
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-surface border border-surface-border rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
        >
          <option value="">Select category</option>
          {CATEGORY_NAMES.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        {errors.category && <p className="text-danger text-xs mt-1.5 font-medium">{errors.category}</p>}
      </div>

      {catConfig && catConfig.fiscalYears.length > 0 && (
        <div>
          <label htmlFor="doc-fy" className="block text-sm font-medium text-ink mb-1.5">
            Fiscal Year
          </label>
          <select
            id="doc-fy"
            value={fiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-surface border border-surface-border rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          >
            <option value="">Select fiscal year</option>
            {catConfig.fiscalYears.map((fy) => (
              <option key={fy} value={fy}>{fy}</option>
            ))}
          </select>
          {errors.fiscalYear && <p className="text-danger text-xs mt-1.5 font-medium">{errors.fiscalYear}</p>}
        </div>
      )}

      {catConfig && catConfig.subCategories.length > 0 && (
        <div>
          <label htmlFor="doc-subcat" className="block text-sm font-medium text-ink mb-1.5">
            Sub-Category
          </label>
          <select
            id="doc-subcat"
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-surface border border-surface-border rounded-lg text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          >
            <option value="">Select sub-category</option>
            {catConfig.subCategories.map((sc) => (
              <option key={sc} value={sc}>{sc}</option>
            ))}
          </select>
          {errors.subCategory && <p className="text-danger text-xs mt-1.5 font-medium">{errors.subCategory}</p>}
        </div>
      )}

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
