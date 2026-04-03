'use client'

import { useState } from 'react'

interface CategoryConfig {
  fiscalYears: string[]
  subCategories: string[]
}

interface CategoryManagerProps {
  categories: Record<string, CategoryConfig>
  onSave: (categories: Record<string, CategoryConfig>) => void
  onCancel: () => void
  loading?: boolean
}

export default function CategoryManager({ categories, onSave, onCancel, loading = false }: CategoryManagerProps) {
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categoryData, setCategoryData] = useState(categories)
  const [errors, setErrors] = useState<{ name?: string }>({})

  const handleAddCategory = () => {
    const trimmed = newCategoryName.trim()
    if (!trimmed) {
      setErrors({ name: 'Category name is required' })
      return
    }
    if (categoryData[trimmed]) {
      setErrors({ name: 'Category already exists' })
      return
    }
    setCategoryData({ ...categoryData, [trimmed]: { fiscalYears: [], subCategories: [] } })
    setNewCategoryName('')
    setErrors({})
  }

  const handleDeleteCategory = (name: string) => {
    const copy = { ...categoryData }
    delete copy[name]
    setCategoryData(copy)
  }

  const handleAddFiscalYear = (category: string) => {
    const year = prompt('Enter fiscal year (e.g., FY 2025-26):')
    if (!year) return
    const current = categoryData[category]
    if (current.fiscalYears.includes(year)) {
      alert('Fiscal year already exists')
      return
    }
    setCategoryData({
      ...categoryData,
      [category]: { ...current, fiscalYears: [...current.fiscalYears, year] },
    })
  }

  const handleDeleteFiscalYear = (category: string, year: string) => {
    const current = categoryData[category]
    setCategoryData({
      ...categoryData,
      [category]: { ...current, fiscalYears: current.fiscalYears.filter((y) => y !== year) },
    })
  }

  const handleAddSubCategory = (category: string) => {
    const sub = prompt('Enter sub-category name:')
    if (!sub) return
    const current = categoryData[category]
    if (current.subCategories.includes(sub)) {
      alert('Sub-category already exists')
      return
    }
    setCategoryData({
      ...categoryData,
      [category]: { ...current, subCategories: [...current.subCategories, sub] },
    })
  }

  const handleDeleteSubCategory = (category: string, sub: string) => {
    const current = categoryData[category]
    setCategoryData({
      ...categoryData,
      [category]: { ...current, subCategories: current.subCategories.filter((s) => s !== sub) },
    })
  }

  return (
    <div className="space-y-4">
      {/* Add new category section */}
      <div className="bg-surface rounded-xl p-4 border border-surface-border">
        <h4 className="text-sm font-semibold text-ink mb-3">Add New Category</h4>
        <div className="flex gap-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Enter category name"
            className="flex-1 px-3 py-2 bg-white border border-surface-border rounded-lg text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
          />
          <button
            onClick={handleAddCategory}
            className="px-4 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors shadow-sm flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add
          </button>
        </div>
        {errors.name && <p className="text-danger text-xs mt-1.5 font-medium">{errors.name}</p>}
      </div>

      {/* Existing categories list */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {Object.entries(categoryData).map(([name, config]) => (
          <div key={name} className="bg-white rounded-xl border border-surface-border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-surface-border">
              <div className="flex-1">
                <h5 className="text-sm font-semibold text-ink">{name}</h5>
                <p className="text-xs text-ink-muted mt-0.5">
                  {config.fiscalYears.length} fiscal year(s), {config.subCategories.length} sub-category(ies)
                </p>
              </div>
              <button
                onClick={() => handleDeleteCategory(name)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-ink-muted hover:text-danger transition-colors"
                title="Delete category"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>

            <div className="px-4 py-3 space-y-3">
              {/* Fiscal Years */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-ink-muted">Fiscal Years</span>
                  <button
                    onClick={() => handleAddFiscalYear(name)}
                    className="text-xs text-accent hover:text-accent-hover font-medium flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add Year
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {config.fiscalYears.length === 0 ? (
                    <span className="text-xs text-ink-muted italic">No fiscal years</span>
                  ) : (
                    config.fiscalYears.map((year) => (
                      <span
                        key={year}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-accent/10 text-accent rounded"
                      >
                        {year}
                        <button
                          onClick={() => handleDeleteFiscalYear(name, year)}
                          className="hover:text-danger"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Sub Categories */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-ink-muted">Sub-Categories</span>
                  <button
                    onClick={() => handleAddSubCategory(name)}
                    className="text-xs text-accent hover:text-accent-hover font-medium flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Add Sub-Category
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {config.subCategories.length === 0 ? (
                    <span className="text-xs text-ink-muted italic">No sub-categories</span>
                  ) : (
                    config.subCategories.map((sub) => (
                      <span
                        key={sub}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-50 text-blue-600 rounded"
                      >
                        {sub}
                        <button
                          onClick={() => handleDeleteSubCategory(name, sub)}
                          className="hover:text-danger"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
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
          type="button"
          onClick={() => onSave(categoryData)}
          disabled={loading}
          className="px-5 py-2 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save Categories'
          )}
        </button>
      </div>
    </div>
  )
}
