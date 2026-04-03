'use client'

import { useState } from 'react'
import { CATEGORIES, CATEGORY_NAMES } from '@/lib/document-categories'

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
}

function getFileExtension(filePath: string): string {
  const parts = filePath.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

function getFileIcon(ext: string): { color: string; label: string } {
  switch (ext) {
    case 'pdf':  return { color: 'bg-red-100 text-red-600', label: 'PDF' }
    case 'doc':
    case 'docx': return { color: 'bg-blue-100 text-blue-600', label: 'DOC' }
    case 'xls':
    case 'xlsx': return { color: 'bg-green-100 text-green-600', label: 'XLS' }
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':  return { color: 'bg-purple-100 text-purple-600', label: 'IMG' }
    default:     return { color: 'bg-gray-100 text-gray-600', label: ext.toUpperCase() || 'FILE' }
  }
}

function DocRow({ doc, onEdit, onDelete, getAuthToken }: { doc: DocumentRecord; onEdit: () => void; onDelete: () => void; getAuthToken: () => string | null }) {
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)
  const ext = getFileExtension(doc.filePath)
  const icon = getFileIcon(ext)
  
  const handleView = async () => {
    try {
      setIsLoadingUrl(true)
      const token = getAuthToken()
      const response = await fetch(`/api/admin/documents/${doc.id}/download-url`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover/40 rounded-lg group transition-colors">
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase flex-shrink-0 ${icon.color}`}>
        {icon.label}
      </span>
      <span className="text-sm text-ink flex-1 min-w-0 truncate">{doc.title}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        <button
          onClick={handleView}
          disabled={isLoadingUrl}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-surface-hover text-ink-muted hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="View"
        >
          {isLoadingUrl ? (
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
        <button
          onClick={onEdit}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-surface-hover text-ink-muted hover:text-accent transition-colors"
          title="Edit"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-red-50 text-ink-muted hover:text-danger transition-colors"
          title="Delete"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
      className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-accent hover:bg-accent/10 rounded-md transition-colors"
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
      className={`w-3.5 h-3.5 text-ink-muted transition-transform duration-150 ${open ? 'rotate-90' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  )
}

export default function DocumentList({
  documents, onEdit, onDelete, onUpload, getAuthToken,
  categoryConfig,
}: DocumentListProps & { categoryConfig?: Record<string, { fiscalYears: string[]; subCategories: string[] }> }) {
  // Track which sections are open (collapsed by default)
  const [openSections, setOpenSections] = useState<Set<string>>(new Set())

  const toggle = (key: string) => {
    setOpenSections(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  const getLeafDocs = (category: string, fiscalYear: string | null, subCategory: string | null) =>
    documents.filter(d =>
      d.category === category &&
      (d.fiscalYear ?? null) === fiscalYear &&
      (d.subCategory ?? null) === subCategory
    )

  const uncategorised = documents.filter(d => !d.category)

  const configToUse = categoryConfig || CATEGORIES
  const categoryNames = Object.keys(configToUse)

  return (
    <div className="space-y-2">
      {categoryNames.map(category => {
        const config = configToUse[category]
        const catOpen = openSections.has(category)
        const catDocCount = documents.filter(d => d.category === category).length

        return (
          <div key={category} className="rounded-xl border border-surface-border overflow-hidden">
            {/* Category header */}
            <div className="flex items-center gap-2.5 px-4 py-3 bg-surface">
              <button
                onClick={() => toggle(category)}
                className="flex items-center gap-2.5 flex-1 hover:opacity-80 transition-opacity text-left"
              >
                <ChevronIcon open={catOpen} />
                <svg className="w-4 h-4 text-accent flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
                </svg>
                <span className="text-sm font-semibold text-ink flex-1">{category}</span>
                {catDocCount > 0 && (
                  <span className="text-[11px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                    {catDocCount}
                  </span>
                )}
              </button>
              {/* Direct upload for Incorporation & Other Documents */}
              {config.fiscalYears.length === 0 && (
                <UploadButton onClick={() => onUpload({ category, fiscalYear: null, subCategory: null })} />
              )}
            </div>

            {catOpen && (
              <div className="divide-y divide-surface-border">
                {/* No fiscal year: show docs directly */}
                {config.fiscalYears.length === 0 && (() => {
                  const leafDocs = getLeafDocs(category, null, null)
                  return (
                    <div className="px-2 py-1.5">
                      {leafDocs.length === 0 ? (
                        <p className="text-xs text-ink-muted px-2 py-2 italic">No documents uploaded</p>
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
                      <div className="flex items-center gap-2 pl-8 pr-4 py-2.5 hover:bg-surface-hover/60 transition-colors">
                        <button
                          onClick={() => toggle(fyKey)}
                          className="flex items-center gap-2 flex-1 text-left"
                        >
                          <ChevronIcon open={fyOpen} />
                          <svg className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                          </svg>
                          <span className="text-xs font-semibold text-ink-secondary flex-1">{fy}</span>
                          {fyDocCount > 0 && (
                            <span className="text-[10px] font-medium text-ink-muted bg-surface-border px-1.5 py-0.5 rounded-full">
                              {fyDocCount}
                            </span>
                          )}
                        </button>
                        {/* Direct upload for categories with no sub-categories */}
                        {config.subCategories.length === 0 && (
                          <UploadButton onClick={() => onUpload({ category, fiscalYear: fy, subCategory: null })} />
                        )}
                      </div>

                      {fyOpen && (
                        <div className="divide-y divide-surface-border/50">
                          {/* No sub-categories: show docs directly under FY */}
                          {config.subCategories.length === 0 && (() => {
                            const leafDocs = getLeafDocs(category, fy, null)
                            return (
                              <div className="pl-10 pr-2 py-1.5">
                                {leafDocs.length === 0 ? (
                                  <p className="text-xs text-ink-muted px-2 py-2 italic">No documents uploaded</p>
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
                                <div className="flex items-center gap-2 pl-14 pr-4 py-2 bg-surface/50">
                                  <svg className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                  </svg>
                                  <span className="text-xs font-semibold text-ink-secondary flex-1">{sc}</span>
                                  {leafDocs.length > 0 && (
                                    <span className="text-[10px] font-medium text-ink-muted bg-surface-border px-1.5 py-0.5 rounded-full">
                                      {leafDocs.length}
                                    </span>
                                  )}
                                  <UploadButton onClick={() => onUpload({ category, fiscalYear: fy, subCategory: sc })} />
                                </div>
                                <div className="pl-16 pr-2 py-1.5">
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
        <div className="rounded-xl border border-surface-border overflow-hidden">
          <div className="px-4 py-3 bg-surface">
            <span className="text-sm font-semibold text-ink-secondary">Uncategorised</span>
          </div>
          <div className="px-2 py-1.5">
            {uncategorised.map(doc => (
              <DocRow key={doc.id} doc={doc} onEdit={() => onEdit(doc)} onDelete={() => onDelete(doc)} getAuthToken={getAuthToken} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
