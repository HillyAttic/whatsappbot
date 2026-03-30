'use client'

interface DocumentRecord {
  id: string
  phone?: string
  title: string
  filePath: string
  uploadedAt?: string
}

interface DocumentListProps {
  documents: DocumentRecord[]
  onEdit: (document: DocumentRecord) => void
  onDelete: (document: DocumentRecord) => void
}

function getFileExtension(filePath: string): string {
  const parts = filePath.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

function getFileIcon(ext: string): { color: string; label: string } {
  switch (ext) {
    case 'pdf':
      return { color: 'bg-red-100 text-red-600', label: 'PDF' }
    case 'doc':
    case 'docx':
      return { color: 'bg-blue-100 text-blue-600', label: 'DOC' }
    case 'xls':
    case 'xlsx':
      return { color: 'bg-green-100 text-green-600', label: 'XLS' }
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return { color: 'bg-purple-100 text-purple-600', label: 'IMG' }
    default:
      return { color: 'bg-gray-100 text-gray-600', label: ext.toUpperCase() || 'FILE' }
  }
}

export default function DocumentList({ documents, onEdit, onDelete }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-2xl bg-surface mx-auto mb-4 flex items-center justify-center">
          <svg className="w-10 h-10 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <p className="text-ink-secondary text-sm font-medium">No documents yet</p>
        <p className="text-ink-muted text-xs mt-1">Upload a document to get started</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-surface-border">
      <table className="w-full">
        <thead>
          <tr className="bg-surface border-b border-surface-border">
            <th className="px-5 py-3 text-left text-xs font-semibold text-ink-secondary uppercase tracking-wider">Document</th>
            <th className="px-5 py-3 text-left text-xs font-semibold text-ink-secondary uppercase tracking-wider hidden md:table-cell">File Path</th>
            <th className="px-5 py-3 text-right text-xs font-semibold text-ink-secondary uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">
          {documents.map((doc, index) => {
            const ext = getFileExtension(doc.filePath)
            const icon = getFileIcon(ext)
            return (
              <tr
                key={doc.id}
                className="stagger-item hover:bg-surface-hover/50 transition-colors"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${icon.color}`}>
                      {icon.label}
                    </span>
                    <span className="text-sm font-medium text-ink">{doc.title}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 hidden md:table-cell">
                  <span className="text-xs text-ink-muted font-mono bg-surface px-2 py-1 rounded">{doc.filePath}</span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(doc)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-hover text-ink-muted hover:text-accent transition-colors"
                      title="Edit document"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(doc)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-danger-light text-ink-muted hover:text-danger transition-colors"
                      title="Delete document"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
