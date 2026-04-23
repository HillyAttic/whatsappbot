'use client'

import { useState, useMemo } from 'react'

interface ClientRecord {
  id: string
  name: string
  phones: string[]
  gstNumber?: string
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
    'bg-[#e8590c]', 'bg-[#0c8599]', 'bg-[#2b8a3e]', 'bg-[#c92a2a]',
    'bg-[#7048e8]', 'bg-[#d9480f]', 'bg-[#1098ad]', 'bg-[#e67700]',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export default function ClientList({ clients, selectedClientId, onSelect, onEdit, onDelete }: ClientListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients

    const query = searchQuery.toLowerCase()
    return clients.filter(client =>
      client.name.toLowerCase().includes(query) ||
      client.phones.some(p => p.includes(query)) ||
      client.gstNumber?.toLowerCase().includes(query)
    )
  }, [clients, searchQuery])

  if (clients.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-20 h-20 rounded-none bg-sidebar-hover mx-auto mb-5 flex items-center justify-center border border-sidebar-border relative">
          <svg className="w-10 h-10 text-ink-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent/30 rotate-12" />
        </div>
        <p className="text-ink-muted text-sm font-medium">No clients yet</p>
        <p className="text-ink-muted/60 text-xs mt-1">Add your first client to get started</p>
      </div>
    )
  }

  return (
    <>
      <div className="px-4 py-3 border-b border-sidebar-border">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search clients..."
            className="w-full px-3 py-2 pl-9 bg-sidebar-hover border border-sidebar-border rounded text-sm text-ink-inverse placeholder:text-ink-muted/50 focus:outline-none focus:border-accent/50 transition-colors"
          />
          <svg className="w-4 h-4 text-ink-muted/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center hover:bg-white/10 rounded text-ink-muted hover:text-ink-inverse transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="text-center py-12 px-4">
          <svg className="w-12 h-12 text-ink-muted/30 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <p className="text-ink-muted text-sm">No clients found</p>
          <p className="text-ink-muted/60 text-xs mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="space-y-0.5 px-1">
          {filteredClients.map((client, index) => {
        const isSelected = selectedClientId === client.id
        return (
          <div
            key={client.id}
            className="stagger-item group relative"
            style={{ animationDelay: `${index * 40}ms` }}
          >
            <button
              onClick={() => onSelect(client)}
              className={`w-full text-left px-3 py-3.5 transition-all duration-150 flex items-center gap-3 border-l-2 ${
                isSelected
                  ? 'bg-accent/10 border-accent'
                  : 'border-transparent hover:bg-sidebar-hover hover:border-ink/10'
              }`}
            >
              <div className={`w-10 h-10 rounded-none ${getAvatarColor(client.name)} flex items-center justify-center flex-shrink-0 relative`}>
                <span className="text-white text-xs font-bold tracking-wide">{getInitials(client.name)}</span>
                {isSelected && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent border-2 border-sidebar" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold truncate ${isSelected ? 'text-accent' : 'text-ink-inverse'}`}>
                  {client.name}
                </div>
                <div className="text-[11px] text-ink-muted font-mono truncate mt-0.5">
                  {client.phones[0]}
                  {client.phones.length > 1 && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-accent/20 text-accent rounded">
                      +{client.phones.length - 1} more
                    </span>
                  )}
                </div>
                {client.gstNumber && (
                  <div className="text-[10px] text-ink-muted/70 font-mono truncate mt-0.5">
                    GST: {client.gstNumber}
                  </div>
                )}
              </div>
              <div className={`flex items-center gap-0.5 transition-opacity duration-150 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); onEdit(client) }}
                  onKeyDown={(e) => e.key === 'Enter' && onEdit(client)}
                  className="w-7 h-7 flex items-center justify-center hover:bg-white/10 text-ink-muted hover:text-accent-light cursor-pointer transition-colors"
                  title="Edit client"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); onDelete(client) }}
                  onKeyDown={(e) => e.key === 'Enter' && onDelete(client)}
                  className="w-7 h-7 flex items-center justify-center hover:bg-danger/20 text-ink-muted hover:text-danger cursor-pointer transition-colors"
                  title="Delete client"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </span>
              </div>
            </button>
          </div>
        )
      })}
    </div>
      )}
    </>
  )
}
