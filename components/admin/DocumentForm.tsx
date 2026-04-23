'use client'

import { useState, useEffect, FormEvent } from 'react'
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
  files: File[]
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
  categoryConfig?: Record<string, { fiscalYears: string[]; subCategories: string[] }>
}

export default function DocumentForm({ initial, preset, onSubmit, onCancel, categoryConfig }: DocumentFormProps) {
  const [title, setTitle] = useState(initial?.title || '')
  const [file, setFile] = useState<File | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const isMultiMode = !initial && files.length > 1
  const [category, setCategory] = useState(initial?.category || preset?.category || '')
  const [fiscalYear, setFiscalYear] = useState<string>(initial?.fiscalYear || preset?.fiscalYear || '')
  const [subCategory, setSubCategory] = useState<string>(initial?.subCategory || preset?.subCategory || '')
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({})

  const categoriesToUse = categoryConfig || CATEGORIES
  const categoryNames = Object.keys(categoriesToUse)
  const catConfig = category ? categoriesToUse[category] : null

  const handleCategoryChange = (val: string) => {
    setCategory(val)
    setFiscalYear('')
    setSubCategory('')
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    const newErrors: Partial<Record<string, string>> = {}

    if (!isMultiMode && !title.trim()) newErrors.title = 'Title is required.'
    if (!category) newErrors.category = 'Category is required.'
    if (!initial && files.length === 0) newErrors.file = 'At least one file is required.'

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
      file: files.length === 1 ? files[0] : null,
      files,
      category,
      fiscalYear: fiscalYear || null,
      subCategory: subCategory || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {!isMultiMode && (
        <div>
          <label htmlFor="doc-title" className="eyebrow block mb-2">Document Title</label>
          <input
            type="text"
            id="doc-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter document title"
            className="w-full px-4 py-3 bg-surface border-2 border-ink/10 rounded-none text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent transition-all"
          />
          {errors.title && <p className="text-danger text-xs mt-1.5 font-medium">{errors.title}</p>}
        </div>
      )}

      <div>
        <label htmlFor="doc-category" className="eyebrow block mb-2">Category</label>
        <select
          id="doc-category"
          value={category}
          onChange={(e) => handleCategoryChange(e.target.value)}
          className="w-full px-4 py-3 bg-surface border-2 border-ink/10 rounded-none text-sm text-ink focus:outline-none focus:border-accent transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20d%3D%22M6%209l4%204%204-4%22%20fill%3D%22none%22%20stroke%3D%22%23333%22%20stroke-width%3D%222%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat"
        >
          <option value="">Select category</option>
          {categoryNames.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        {errors.category && <p className="text-danger text-xs mt-1.5 font-medium">{errors.category}</p>}
      </div>

      {catConfig && catConfig.fiscalYears.length > 0 && (
        <div>
          <label htmlFor="doc-fy" className="eyebrow block mb-2">Fiscal Year</label>
          <select
            id="doc-fy"
            value={fiscalYear}
            onChange={(e) => setFiscalYear(e.target.value)}
            className="w-full px-4 py-3 bg-surface border-2 border-ink/10 rounded-none text-sm text-ink focus:outline-none focus:border-accent transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20d%3D%22M6%209l4%204%204-4%22%20fill%3D%22none%22%20stroke%3D%22%23333%22%20stroke-width%3D%222%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat"
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
          <label htmlFor="doc-subcat" className="eyebrow block mb-2">Sub-Category</label>
          <select
            id="doc-subcat"
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
            className="w-full px-4 py-3 bg-surface border-2 border-ink/10 rounded-none text-sm text-ink focus:outline-none focus:border-accent transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20d%3D%22M6%209l4%204%204-4%22%20fill%3D%22none%22%20stroke%3D%22%23333%22%20stroke-width%3D%222%22%2F%3E%3C%2Fsvg%3E')] bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat"
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
        <label htmlFor="doc-file" className="eyebrow block mb-2">
          {initial ? (
            <>File <span className="text-ink-muted font-normal normal-case text-xs"> (leave empty to keep existing)</span></>
          ) : (
            <>Files <span className="text-ink-muted font-normal normal-case text-xs"> (select multiple to bulk upload)</span></>
          )}
        </label>
        <div className="relative">
          <input
            type="file"
            id="doc-file"
            multiple={!initial}
            onChange={(e) => {
              const selected = e.target.files ? Array.from(e.target.files) : []
              setFiles(selected)
              setFile(selected[0] || null)
            }}
            className="w-full px-4 py-3 bg-surface border-2 border-ink/10 rounded-none text-sm text-ink file:mr-4 file:py-1 file:px-4 file:border-0 file:text-xs file:font-bold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 file:cursor-pointer file:uppercase file:tracking-wider focus:outline-none focus:border-accent transition-all"
          />
        </div>
        {errors.file && <p className="text-danger text-xs mt-1.5 font-medium">{errors.file}</p>}
        {isMultiMode && (
          <div className="mt-3 space-y-1">
            <p className="text-xs text-ink-muted font-medium uppercase tracking-wider">{files.length} files selected — filenames will be used as titles</p>
            <div className="max-h-32 overflow-y-auto space-y-0.5">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-none bg-ink/[0.02] border border-ink/5 text-xs text-ink-secondary">
                  <svg className="w-3 h-3 text-ink-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <span className="truncate flex-1">{f.name}</span>
                  <span className="text-ink-muted ml-auto flex-shrink-0 font-mono">{(f.size / 1024).toFixed(0)} KB</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-3 border-t border-ink/5">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-sm font-medium text-ink-secondary hover:text-ink rounded-none hover:bg-surface-hover transition-colors border border-ink/10 hover:border-ink/20"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 text-sm font-bold uppercase tracking-wider bg-accent text-white rounded-none hover:bg-accent-hover transition-colors shadow-bold hover:shadow-glow-accent border-2 border-transparent"
        >
          {initial ? 'Update' : 'Upload'}
        </button>
      </div>
    </form>
  )
}
