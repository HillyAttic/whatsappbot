'use client'

import { useState } from 'react'
import { CATEGORIES, CATEGORY_NAMES } from '@/lib/document-categories'
import RenameDialog from './RenameDialog'
import ConfirmDialog from './ConfirmDialog'

export interface DocumentRecord {
  id: string
  phone?: string
  title: string
  filePath: string
  uploadedAt?: string
  category?: string
  fiscalYear?: string | null
  subCategory?: string | null
}

export interface UploadPreset {
  category: string
  fiscalYear: string | null
  subCategory: string | null
}

interface DocumentListProps {
  documents: DocumentRecord[]
  onEdit: (document: DocumentRecord) => void
  onDelete: (document: DocumentRecord) => void
  onUpload: (preset: UploadPreset) => void
  getAuthToken: () => string | null
  categoryConfig?: Record<string, { fiscalYears: string[]; subCategories: string[] }>
  onDocumentsChanged?: () => void
}

type FileExt = 'pdf' | 'doc' | 'docx' | 'xls' | 'xlsx' | 'jpg' | 'jpeg' | 'png' | 'gif' | string

function getFileExtension(filePath: string): string {
  const parts = filePath.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

function getFileIcon(ext: string): { bg: string; text: string; label: string; border: string } {
  const map: Record<string, { bg: string; text: string; label: string; border: string }> = {
    pdf:    { bg: 'bg-[#c92a2a]/10', text: 'text-[#c92a2a]', label: 'PDF', border: 'border-[#c92a2a]/20' },
    doc:    { bg: 'bg-[#0c8599]/10', text: 'text-[#0c8599]', label: 'DOC', border: 'border-[#0c8599]/20' },
    docx:   { bg: 'bg-[#0c8599]/10', text: 'text-[#0c8599]', label: 'DOC', border: 'border-[#0c8599]/20' },
    xls:    { bg: 'bg-[#2b8a3e]/10', text: 'text-[#2b8a3e]', label: 'XLS', border: 'border-[#2b8a3e]/20' },
    xlsx:   { bg: 'bg-[#2b8a3e]/10', text: 'text-[#2b8a3e]', label: 'XLS', border: 'border-[#2b8a3e]/20' },
    jpg:    { bg: 'bg-[#7048e8]/10', text: 'text-[#7048e8]', label: 'IMG', border: 'border-[#7048e8]/20' },
    jpeg:   { bg: 'bg-[#7048e8]/10', text: 'text-[#7048e8]', label: 'IMG', border: 'border-[#7048e8]/20' },
    png:    { bg: 'bg-[#7048e8]/10', text: 'text-[#7048e8]', label: 'IMG', border: 'border-[#7048e8]/20' },
    gif:    { bg: 'bg-[#7048e8]/10', text: 'text-[#7048e8]', label: 'IMG', border: 'border-[#7048e8]/20' },
  }
  return map[ext] || { bg: 'bg-ink/5', text: 'text-ink-muted', label: (ext || 'FILE').toUpperCase(), border: 'border-ink/10' }
}

function DocRow({ doc, onEdit, onDelete, getAuthToken }: {
  doc: DocumentRecord
  onEdit: () => void
  onDelete: () => void
  getAuthToken: () => string | null
}) {
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)
  const ext = getFileExtension(doc.filePath)
  const icon = getFileIcon(ext)

  const handleView = async () => {
    try {
      setIsLoadingUrl(true)
      const token = getAuthToken()
      const response = await fetch(`/api/admin/documents/${doc.id}/download-url`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to get download URL')
      const data = await response.json()
      window.open(data.url, '_blank')
    } catch (error) {
      console.error('Error viewing document:', error)
      alert('Failed to open document. Please try again.')
    } finally {
      setIsLoadingUrl(false)
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-ink/[0.03] group transition-colors border-b border-ink/5 last:border-0">
      <span className={`inline-flex items-center justify-center w-8 h-5 rounded-none text-[9px] font-bold uppercase flex-shrink-0 ${icon.bg} ${icon.text} ${icon.border} border`}>
        {icon.label}
      </span>
      <span className="text-sm text-ink flex-1 min-w-0 truncate font-medium">{doc.title}</span>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={handleView}
          disabled={isLoadingUrl}
          className="w-7 h-7 flex items-center justify-center hover:bg-ink/5 text-ink-muted hover:text-[#0c8599] transition-colors disabled:opacity-50"
          title="View"
        >
          {isLoadingUrl ? (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
        <button
          onClick={onEdit}
          className="w-7 h-7 flex items-center justify-center hover:bg-ink/5 text-ink-muted hover:text-accent transition-colors"
          title="Edit"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="w-7 h-7 flex items-center justify-center hover:bg-danger/10 text-ink-muted hover:text-danger transition-colors"
          title="Delete"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function UploadButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-accent hover:bg-accent/10 border border-accent/20 hover:border-accent/40 transition-all"
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
      Upload
    </button>
  )
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 text-ink-muted transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  )
}

interface RenameTarget {
  type: 'category' | 'fiscalYear' | 'subCategory'
  category: string
  fiscalYear?: string
  subCategory?: string
  currentName: string
}

interface DeleteTarget {
  type: 'category' | 'fiscalYear' | 'subCategory'
  category: string
  fiscalYear?: string
  subCategory?: string
  name: string
}

export default function DocumentList({
  documents, onEdit, onDelete, onUpload, getAuthToken,
  categoryConfig, onDocumentsChanged,
}: DocumentListProps & { categoryConfig?: Record<string, { fiscalYears: string[]; subCategories: string[] }> }) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)
  const [isRenaming, setIsRenaming] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const toggle = (key: string) => {
    setOpenSections(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const handleRename = async (newName: string) => {
    if (!renameTarget) return

    try {
      setIsRenaming(true)
      const token = getAuthToken()
      const response = await fetch('/api/admin/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: renameTarget.type,
          category: renameTarget.category,
          fiscalYear: renameTarget.fiscalYear,
          subCategory: renameTarget.subCategory,
          newName
        })
      })

      if (!response.ok) {
        throw new Error('Failed to rename')
      }

      // Update open sections keys to reflect the renamed item
      setOpenSections(prev => {
        const next = new Set<string>()
        const oldName = renameTarget.currentName

        if (renameTarget.type === 'category') {
          // Update category key and any fiscal year keys that contain this category
          for (const key of prev) {
            if (key === oldName) {
              next.add(newName)
            } else if (key.startsWith(`${oldName}||`)) {
              next.add(key.replace(`${oldName}||`, `${newName}||`))
            } else {
              next.add(key)
            }
          }
        } else if (renameTarget.type === 'fiscalYear') {
          // Update fiscal year keys that contain this FY
          const category = renameTarget.category
          const oldFyKey = `${category}||${oldName}`
          const newFyKey = `${category}||${newName}`
          for (const key of prev) {
            if (key === oldFyKey) {
              next.add(newFyKey)
            } else {
              next.add(key)
            }
          }
        } else {
          // Subcategory rename doesn't affect open sections
          for (const key of prev) {
            next.add(key)
          }
        }

        return next
      })

      // Refresh documents from parent
      if (onDocumentsChanged) {
        onDocumentsChanged()
      }
    } catch (error) {
      console.error('Error renaming:', error)
      alert('Failed to rename. Please try again.')
    } finally {
      setIsRenaming(false)
      setRenameTarget(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      setIsDeleting(true)
      const token = getAuthToken()
      const response = await fetch('/api/admin/delete-category', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: deleteTarget.type,
          category: deleteTarget.category,
          fiscalYear: deleteTarget.fiscalYear,
          subCategory: deleteTarget.subCategory
        })
      })

      if (!response.ok) {
        throw new Error('Failed to delete')
      }

      // Remove the deleted item from open sections
      setOpenSections(prev => {
        const next = new Set<string>()
        const deletedName = deleteTarget.name

        if (deleteTarget.type === 'category') {
          for (const key of prev) {
            if (key !== deletedName && !key.startsWith(`${deletedName}||`)) {
              next.add(key)
            }
          }
        } else if (deleteTarget.type === 'fiscalYear') {
          const category = deleteTarget.category
          const deletedFyKey = `${category}||${deletedName}`
          for (const key of prev) {
            if (key !== deletedFyKey) {
              next.add(key)
            }
          }
        } else {
          for (const key of prev) {
            next.add(key)
          }
        }
        return next
      })

      // Refresh documents from parent
      if (onDocumentsChanged) {
        onDocumentsChanged()
      }
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Failed to delete. Please try again.')
    } finally {
      setIsDeleting(false)
      setDeleteTarget(null)
    }
  }

  const getLeafDocs = (category: string, fiscalYear: string | null, subCategory: string | null) =>
    documents.filter(d =>
      d.category === category &&
      (d.fiscalYear ?? null) === fiscalYear &&
      (d.subCategory ?? null) === subCategory
    )

  const uncategorised = documents.filter(d => !d.category)

  const configToUse = categoryConfig || CATEGORIES
  const categoryNames = Object.keys(configToUse).reverse()

  return (
    <div className="space-y-3">
      {categoryNames.map(category => {
        const config = configToUse[category]
        const catOpen = openSections.has(category)
        const catDocCount = documents.filter(d => d.category === category).length

        return (
          <div key={category} className="border-2 border-ink/8 overflow-hidden bg-white">
            {/* Category header */}
            <div className="flex items-center gap-2.5 px-4 py-3 bg-surface/80 hover:bg-surface transition-colors border-b border-ink/8 group">
              <div className="flex items-center gap-2.5 flex-1 cursor-pointer" onClick={() => toggle(category)}>
                <ChevronIcon open={catOpen} />
                <div className="w-1.5 h-1.5 rounded-none bg-accent flex-shrink-0" />
                <span className="text-sm font-bold text-ink flex-1 font-display">{category}</span>
                {catDocCount > 0 && (
                  <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 uppercase tracking-wider border border-accent/20">
                    {catDocCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setRenameTarget({ type: 'category', category, currentName: category })
                  }}
                  className="w-7 h-7 flex items-center justify-center hover:bg-accent/10 text-ink-muted hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                  title="Rename category"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                  </svg>
                </button>
                {config.fiscalYears.length === 0 && (
                  <UploadButton onClick={() => onUpload({ category, fiscalYear: null, subCategory: null })} />
                )}
              </div>
            </div>

            {catOpen && (
              <div>
                {/* No fiscal year: show docs directly */}
                {config.fiscalYears.length === 0 && (() => {
                  const leafDocs = getLeafDocs(category, null, null)
                  return (
                    <div className="px-2 py-1">
                      {leafDocs.length === 0 ? (
                        <p className="text-xs text-ink-muted px-3 py-3 italic">No documents uploaded</p>
                      ) : leafDocs.map(doc => (
                        <DocRow key={doc.id} doc={doc} onEdit={() => onEdit(doc)} onDelete={() => onDelete(doc)} getAuthToken={getAuthToken} />
                      ))}
                    </div>
                  )
                })()}

                {/* Has fiscal years */}
                {config.fiscalYears.map(fy => {
                  const fyKey = `${category}||${fy}`
                  const fyOpen = openSections.has(fyKey)
                  const fyDocCount = documents.filter(d => d.category === category && d.fiscalYear === fy).length

                  return (
                    <div key={fy}>
                      {/* FY header */}
                      <div className="flex items-center gap-2 pl-8 pr-4 py-2.5 hover:bg-ink/[0.02] transition-colors border-b border-ink/5 group">
                        <div className="flex items-center gap-2 flex-1 cursor-pointer" onClick={() => toggle(fyKey)}>
                          <ChevronIcon open={fyOpen} />
                          <svg className="w-3.5 h-3.5 text-[#0c8599] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121.75 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                          </svg>
                          <span className="text-xs font-bold text-ink-secondary flex-1 uppercase tracking-wide">{fy}</span>
                          {fyDocCount > 0 && (
                            <span className="text-[10px] font-medium text-ink-muted bg-ink/5 px-1.5 py-0.5 border border-ink/10">
                              {fyDocCount}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setRenameTarget({ type: 'fiscalYear', category, fiscalYear: fy, currentName: fy })
                            }}
                            className="w-7 h-7 flex items-center justify-center hover:bg-accent/10 text-ink-muted hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                            title="Rename fiscal year"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                            </svg>
                          </button>
                          {config.subCategories.length === 0 && (
                            <UploadButton onClick={() => onUpload({ category, fiscalYear: fy, subCategory: null })} />
                          )}
                        </div>
                      </div>

                      {fyOpen && (
                        <div>
                          {/* No sub-categories: show docs directly under FY */}
                          {config.subCategories.length === 0 && (() => {
                            const leafDocs = getLeafDocs(category, fy, null)
                            return (
                              <div className="pl-12 pr-2 py-1">
                                {leafDocs.length === 0 ? (
                                  <p className="text-xs text-ink-muted px-3 py-2 italic">No documents uploaded</p>
                                ) : leafDocs.map(doc => (
                                  <DocRow key={doc.id} doc={doc} onEdit={() => onEdit(doc)} onDelete={() => onDelete(doc)} getAuthToken={getAuthToken} />
                                ))}
                              </div>
                            )
                          })()}

                          {/* Sub-categories */}
                          {config.subCategories.map(sc => {
                            const leafDocs = getLeafDocs(category, fy, sc)
                            return (
                              <div key={sc}>
                                <div className="flex items-center gap-2 pl-14 pr-4 py-2 bg-ink/[0.01] border-b border-ink/5 group">
                                  <svg className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                  </svg>
                                  <span className="text-xs font-semibold text-ink-secondary flex-1">{sc}</span>
                                  {leafDocs.length > 0 && (
                                    <span className="text-[10px] font-medium text-ink-muted bg-ink/5 px-1.5 py-0.5 border border-ink/10">
                                      {leafDocs.length}
                                    </span>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setRenameTarget({ type: 'subCategory', category, fiscalYear: fy, subCategory: sc, currentName: sc })
                                    }}
                                    className="w-7 h-7 flex items-center justify-center hover:bg-accent/10 text-ink-muted hover:text-accent transition-colors opacity-0 group-hover:opacity-100"
                                    title="Rename subcategory"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setDeleteTarget({ type: 'subCategory', category, fiscalYear: fy, subCategory: sc, name: sc })
                                    }}
                                    className="w-7 h-7 flex items-center justify-center hover:bg-danger/10 text-ink-muted hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
                                    title="Delete subcategory"
                                  >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                  </button>
                                  <UploadButton onClick={() => onUpload({ category, fiscalYear: fy, subCategory: sc })} />
                                </div>
                                <div className="pl-16 pr-2 py-1">
                                  {leafDocs.length === 0 ? (
                                    <p className="text-xs text-ink-muted px-2 py-1.5 italic">No documents uploaded</p>
                                  ) : leafDocs.map(doc => (
                                    <DocRow key={doc.id} doc={doc} onEdit={() => onEdit(doc)} onDelete={() => onDelete(doc)} getAuthToken={getAuthToken} />
                                  ))}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Uncategorised legacy documents */}
      {uncategorised.length > 0 && (
        <div className="border-2 border-ink/8 overflow-hidden bg-white">
          <div className="px-4 py-3 bg-surface/80 border-b border-ink/8">
            <span className="text-sm font-bold text-ink-secondary">Uncategorised</span>
          </div>
          <div className="px-2 py-1">
            {uncategorised.map(doc => (
              <DocRow key={doc.id} doc={doc} onEdit={() => onEdit(doc)} onDelete={() => onDelete(doc)} getAuthToken={getAuthToken} />
            ))}
          </div>
        </div>
      )}

      {/* Rename Dialog */}
      {renameTarget && (
        <RenameDialog
          title={`Rename ${renameTarget.type === 'category' ? 'Category' : renameTarget.type === 'fiscalYear' ? 'Fiscal Year' : 'Subcategory'}`}
          currentName={renameTarget.currentName}
          onConfirm={handleRename}
          onCancel={() => setRenameTarget(null)}
          loading={isRenaming}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          message={`Delete "${deleteTarget.name}" ${deleteTarget.type}? ${
            deleteTarget.type === 'subCategory'
              ? 'This will remove the subcategory from the configuration but will NOT delete any documents.'
              : 'This will remove it from the configuration but will NOT delete any documents.'
          }`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={isDeleting}
        />
      )}
    </div>
  )
}
