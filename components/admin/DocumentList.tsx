'use client'

interface DocumentRecord {
  id: string
  phone: string
  title: string
  filePath: string
}

interface DocumentListProps {
  documents: DocumentRecord[]
  onEdit: (document: DocumentRecord) => void
  onDelete: (document: DocumentRecord) => void
}

export default function DocumentList({ documents, onEdit, onDelete }: DocumentListProps) {
  if (documents.length === 0) {
    return <p className="text-gray-600">No documents found for this client.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Title</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">File Path</th>
            <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((document) => (
            <tr key={document.id} className="border-t border-gray-300">
              <td className="px-6 py-4 text-sm text-gray-800">{document.title}</td>
              <td className="px-6 py-4 text-sm text-gray-600 font-mono text-xs">{document.filePath}</td>
              <td className="px-6 py-4 text-sm text-right space-x-2">
                <button
                  onClick={() => onEdit(document)}
                  className="text-green-600 hover:text-green-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(document)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
