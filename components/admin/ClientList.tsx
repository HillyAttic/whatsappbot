'use client'

interface ClientRecord {
  id: string
  name: string
  phone: string
}

interface ClientListProps {
  clients: ClientRecord[]
  onEdit: (client: ClientRecord) => void
  onDelete: (client: ClientRecord) => void
  onViewDocuments: (client: ClientRecord) => void
}

export default function ClientList({ clients, onEdit, onDelete, onViewDocuments }: ClientListProps) {
  if (clients.length === 0) {
    return <p className="text-gray-600">No clients found.</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Name</th>
            <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Phone</th>
            <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id} className="border-t border-gray-300">
              <td className="px-6 py-4 text-sm text-gray-800">{client.name}</td>
              <td className="px-6 py-4 text-sm text-gray-800">{client.phone}</td>
              <td className="px-6 py-4 text-sm text-right space-x-2">
                <button
                  onClick={() => onViewDocuments(client)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Documents
                </button>
                <button
                  onClick={() => onEdit(client)}
                  className="text-green-600 hover:text-green-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(client)}
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
