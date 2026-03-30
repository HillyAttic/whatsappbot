'use client'

interface ClientRecord {
  id: string
  name: string
  phone: string
}

interface ClientListProps {
  clients: ClientRecord[]
  selectedClientId: string | null
  onSelect: (client: ClientRecord) => void
  onEdit: (client: ClientRecord) => void
  onDelete: (client: ClientRecord) => void
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
    'bg-cyan-500', 'bg-purple-500', 'bg-teal-500', 'bg-orange-500',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export default function ClientList({ clients, selectedClientId, onSelect, onEdit, onDelete }: ClientListProps) {
  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-surface-hover mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        </div>
        <p className="text-ink-muted text-sm">No clients yet</p>
        <p className="text-ink-muted text-xs mt-1">Add your first client to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-1 px-2">
      {clients.map((client, index) => {
        const isSelected = selectedClientId === client.id
        return (
          <div
            key={client.id}
            className="stagger-item group relative"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <button
              onClick={() => onSelect(client)}
              className={`w-full text-left px-3 py-3 rounded-xl transition-all duration-150 flex items-center gap-3 ${
                isSelected
                  ? 'bg-accent/10 border border-accent/20'
                  : 'hover:bg-sidebar-hover border border-transparent'
              }`}
            >
              <div className={`w-9 h-9 rounded-lg ${getAvatarColor(client.name)} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <span className="text-white text-xs font-semibold">{getInitials(client.name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${isSelected ? 'text-accent' : 'text-ink-inverse'}`}>
                  {client.name}
                </div>
                <div className="text-xs text-ink-muted font-mono truncate">{client.phone}</div>
              </div>
              <div className={`flex items-center gap-1 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(client)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && onEdit(client)}
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/10 text-ink-muted hover:text-ink-inverse cursor-pointer"
                  title="Edit client"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(client)
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && onDelete(client)}
                  className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-danger/20 text-ink-muted hover:text-danger cursor-pointer"
                  title="Delete client"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </span>
              </div>
            </button>
          </div>
        )
      })}
    </div>
  )
}
