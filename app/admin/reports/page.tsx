'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

type Tab = 'chat' | 'clients'

interface ChatAccessRow {
  sessionId: string
  phone: string
  clientName: string
  date: string
  time: string
  timeTaken: string
  durationMs: number
  documentAccessed: string
  documentAccessCount: number
  status: string
  startedAt: string
  endedAt?: string
}

interface ClientSummaryRow {
  clientId: string
  clientName: string
  phoneCount: number
  phones: string[]
  gstNumber?: string
  categoryCount: number
  categories: string[]
  documentCount: number
  createdAt?: string
}

export default function ReportsPage() {
  const { getToken, signOut } = useAuth()
  const [tab, setTab] = useState<Tab>('clients')
  const [chatRows, setChatRows] = useState<ChatAccessRow[]>([])
  const [clientRows, setClientRows] = useState<ClientSummaryRow[]>([])
  const [loadingChat, setLoadingChat] = useState(false)
  const [loadingClients, setLoadingClients] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const headers = () => ({ Authorization: 'Bearer ' + getToken() })

  async function loadChat() {
    try {
      setLoadingChat(true)
      setError(null)
      const res = await fetch('/api/admin/reports/chat-access', { headers: headers() })
      if (!res.ok) throw new Error('Failed to load chat access report')
      const data = await res.json()
      setChatRows(Array.isArray(data.rows) ? data.rows : [])
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoadingChat(false)
    }
  }

  async function loadClients() {
    try {
      setLoadingClients(true)
      setError(null)
      const res = await fetch('/api/admin/reports/clients-summary', { headers: headers() })
      if (!res.ok) throw new Error('Failed to load clients summary')
      const data = await res.json()
      setClientRows(Array.isArray(data.rows) ? data.rows : [])
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoadingClients(false)
    }
  }

  useEffect(() => {
    loadClients()
    loadChat()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filtering
  const filteredChat = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return chatRows
    return chatRows.filter(
      (r) =>
        r.phone.includes(q) ||
        r.clientName.toLowerCase().includes(q) ||
        r.documentAccessed.toLowerCase().includes(q)
    )
  }, [chatRows, search])

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clientRows
    return clientRows.filter(
      (r) =>
        r.clientName.toLowerCase().includes(q) ||
        r.phones.some((p) => p.includes(q)) ||
        (r.gstNumber || '').toLowerCase().includes(q) ||
        r.categories.some((c) => c.toLowerCase().includes(q))
    )
  }, [clientRows, search])

  // Aggregate totals
  const totals = useMemo(() => {
    const totalPhonesMapped = clientRows.reduce((sum, r) => sum + r.phoneCount, 0)
    const totalDocs = clientRows.reduce((sum, r) => sum + r.documentCount, 0)
    const totalChats = chatRows.length
    return { totalPhonesMapped, totalDocs, totalChats }
  }, [clientRows, chatRows])

  return (
    <div className="h-screen flex overflow-hidden bg-surface relative">
      <div className="absolute inset-0 diagonal-stripes pointer-events-none z-0" />

      {/* Sidebar — same shell as /admin for consistency */}
      <aside className="w-80 flex-shrink-0 bg-sidebar flex flex-col shadow-sidebar z-10 relative">
        <div className="px-6 py-5 border-b-2 border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-none bg-ink flex items-center justify-center">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent" />
            </div>
            <div>
              <h1 className="text-ink-inverse text-lg font-display font-bold tracking-tight leading-none">
                JPCO<span className="text-accent">.</span>
              </h1>
              <p className="text-ink-muted text-[10px] font-mono uppercase tracking-widest mt-0.5">Reports</p>
            </div>
          </div>
        </div>

        <nav className="px-3 pt-4 pb-2 flex flex-col gap-1">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-none hover:bg-sidebar-hover border border-transparent hover:border-sidebar-border transition-colors group"
          >
            <span className="w-7 h-7 flex items-center justify-center bg-sidebar-hover text-ink-inverse">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </span>
            <span className="flex-1">
              <span className="block text-ink-inverse text-sm font-display font-bold tracking-tight leading-none">Back to Clients</span>
              <span className="block text-ink-muted text-[10px] font-mono uppercase tracking-widest mt-0.5">Manage documents</span>
            </span>
          </Link>
        </nav>

        {/* Tab switcher */}
        <div className="px-3 pt-2 pb-1 flex flex-col gap-1">
          <p className="eyebrow text-ink-muted px-3 pt-2">Reports</p>
          <button
            onClick={() => setTab('clients')}
            className={`text-left flex items-center gap-3 px-3 py-2.5 border transition-colors ${
              tab === 'clients'
                ? 'bg-accent/15 border-accent/40 text-ink-inverse'
                : 'bg-transparent border-transparent hover:bg-sidebar-hover text-ink-inverse'
            }`}
          >
            <span
              className={`w-1.5 h-6 ${
                tab === 'clients' ? 'bg-accent' : 'bg-sidebar-border'
              }`}
            />
            <div>
              <p className="text-sm font-display font-bold leading-none">Client Summary</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mt-1">
                {loadingClients ? 'Loading…' : `${clientRows.length} clients`}
              </p>
            </div>
          </button>
          <button
            onClick={() => setTab('chat')}
            className={`text-left flex items-center gap-3 px-3 py-2.5 border transition-colors ${
              tab === 'chat'
                ? 'bg-accent/15 border-accent/40 text-ink-inverse'
                : 'bg-transparent border-transparent hover:bg-sidebar-hover text-ink-inverse'
            }`}
          >
            <span
              className={`w-1.5 h-6 ${
                tab === 'chat' ? 'bg-accent' : 'bg-sidebar-border'
              }`}
            />
            <div>
              <p className="text-sm font-display font-bold leading-none">Chat Access</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-ink-muted mt-1">
                {loadingChat ? 'Loading…' : `${chatRows.length} sessions`}
              </p>
            </div>
          </button>
        </div>

        <div className="mt-auto px-6 py-4 border-t-2 border-sidebar-border">
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-ink-muted hover:text-danger border border-sidebar-border hover:border-danger/40 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col min-h-0 z-10">
        {/* Header */}
        <div className="bg-surface-card border-b-2 border-ink/10">
          <div className="h-1 w-24 bg-accent" />
          <div className="px-8 py-5 flex items-center justify-between gap-6">
            <div>
              <p className="eyebrow text-ink-secondary">Reports Dashboard</p>
              <h2 className="font-display text-2xl text-ink mt-1 leading-none">
                {tab === 'clients' ? 'Client Summary' : 'Chat Access Monitor'}
              </h2>
              <p className="text-ink-secondary text-xs mt-2 font-mono">
                {tab === 'clients'
                  ? 'Consolidated view of every client, mapped phone numbers, and document counts.'
                  : 'Every chat the bot has handled — who came, how long they stayed, and which documents they accessed.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="eyebrow text-ink-secondary">Totals</p>
                <p className="font-mono text-ink text-sm mt-1">
                  {totals.totalChats} chats · {clientRows.length} clients · {totals.totalDocs} docs
                </p>
              </div>
              <button
                onClick={() => {
                  if (tab === 'chat') loadChat()
                  else loadClients()
                }}
                className="w-10 h-10 flex items-center justify-center bg-accent text-white shadow-bold hover:shadow-glow-accent transition-shadow"
                title="Refresh"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-8 py-4 border-b border-ink/10 bg-surface flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={tab === 'clients' ? 'Search by client, phone, GST, category…' : 'Search by phone, client, document…'}
              className="w-full px-4 py-2.5 bg-white border-2 border-ink/10 rounded-none focus:border-accent focus:outline-none text-sm text-ink placeholder:text-ink-muted/60"
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          {error && (
            <p className="text-danger text-xs font-medium">{error}</p>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {tab === 'clients' ? (
            <ClientsSummaryTable rows={filteredClients} loading={loadingClients} />
          ) : (
            <ChatAccessTable rows={filteredChat} loading={loadingChat} />
          )}
        </div>
      </main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Client Summary Table (Report #2)
// ---------------------------------------------------------------------------
function ClientsSummaryTable({ rows, loading }: { rows: ClientSummaryRow[]; loading: boolean }) {
  if (loading && rows.length === 0) {
    return <TableSkeleton rows={6} cols={5} />
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No clients yet"
        body="Add a client and upload documents to populate this report."
      />
    )
  }

  return (
    <div className="bg-white border-2 border-ink/10 shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-ink/[0.03] border-b-2 border-ink/10">
              <Th>Client Name</Th>
              <Th>Phone Numbers Mapped</Th>
              <Th align="right">Numbers</Th>
              <Th align="right">Categories</Th>
              <Th align="right">Documents</Th>
              <Th>Categories Used</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.clientId}
                className="border-b border-ink/5 last:border-0 hover:bg-ink/[0.02] transition-colors"
              >
                <Td>
                  <div>
                    <p className="font-display text-ink font-bold leading-tight">{r.clientName}</p>
                    {r.gstNumber && (
                      <p className="text-[10px] font-mono text-ink-muted mt-0.5">GST: {r.gstNumber}</p>
                    )}
                  </div>
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1.5">
                    {r.phones.length === 0 ? (
                      <span className="text-ink-muted text-xs italic">No phone</span>
                    ) : (
                      r.phones.map((p, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2 py-0.5 bg-ink/5 border border-ink/10 text-ink font-mono text-[11px]"
                        >
                          {p}
                        </span>
                      ))
                    )}
                  </div>
                </Td>
                <Td align="right">
                  <CountBadge value={r.phoneCount} tone="teal" />
                </Td>
                <Td align="right">
                  <CountBadge value={r.categoryCount} tone="gold" />
                </Td>
                <Td align="right">
                  <CountBadge value={r.documentCount} tone="accent" />
                </Td>
                <Td>
                  {r.categories.length === 0 ? (
                    <span className="text-ink-muted text-xs italic">None</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {r.categories.map((c, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2 py-0.5 bg-accent/10 text-accent border border-accent/20 text-[11px] font-mono"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Chat Access Table (Report #1)
// ---------------------------------------------------------------------------
function ChatAccessTable({ rows, loading }: { rows: ChatAccessRow[]; loading: boolean }) {
  if (loading && rows.length === 0) {
    return <TableSkeleton rows={6} cols={6} />
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No chat sessions yet"
        body="Once users start messaging the WhatsApp bot, every visit will appear here with timing and document access details."
      />
    )
  }

  return (
    <div className="bg-white border-2 border-ink/10 shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-ink/[0.03] border-b-2 border-ink/10">
              <Th>User No</Th>
              <Th>Client Name</Th>
              <Th>Date</Th>
              <Th>Time</Th>
              <Th align="right">Time Taken</Th>
              <Th>Doc Report Accessed</Th>
              <Th align="right"># Docs</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.sessionId}
                className="border-b border-ink/5 last:border-0 hover:bg-ink/[0.02] transition-colors"
              >
                <Td>
                  <span className="font-mono text-ink text-[12px]">{r.phone}</span>
                </Td>
                <Td>
                  <p className="font-display text-ink font-bold leading-tight">{r.clientName}</p>
                </Td>
                <Td>
                  <span className="font-mono text-ink-secondary text-[12px]">{r.date}</span>
                </Td>
                <Td>
                  <span className="font-mono text-ink-secondary text-[12px]">{r.time}</span>
                </Td>
                <Td align="right">
                  <span className="font-mono text-ink text-[12px]">{r.timeTaken}</span>
                </Td>
                <Td>
                  {r.documentAccessCount === 0 ? (
                    <span className="text-ink-muted text-xs italic">No document opened</span>
                  ) : (
                    <p
                      className="text-ink-secondary text-[12px] leading-snug max-w-md truncate"
                      title={r.documentAccessed}
                    >
                      {r.documentAccessed}
                    </p>
                  )}
                </Td>
                <Td align="right">
                  <CountBadge value={r.documentAccessCount} tone="teal" />
                </Td>
                <Td>
                  <StatusPill status={r.status} />
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared presentational primitives
// ---------------------------------------------------------------------------
function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className={`px-4 py-3 eyebrow text-ink-secondary font-bold ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  )
}

function Td({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <td className={`px-4 py-3 align-top ${align === 'right' ? 'text-right' : 'text-left'}`}>
      {children}
    </td>
  )
}

function CountBadge({ value, tone }: { value: number; tone: 'accent' | 'teal' | 'gold' }) {
  const tones = {
    accent: 'bg-accent/10 text-accent border-accent/30',
    teal: 'bg-teal/10 text-teal border-teal/30',
    gold: 'bg-gold/15 text-ink border-gold/40',
  } as const
  return (
    <span
      className={`inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 border font-mono font-bold text-[12px] ${tones[tone]}`}
    >
      {value}
    </span>
  )
}

function StatusPill({ status }: { status: string }) {
  const isActive = status === 'active'
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono uppercase tracking-widest border ${
        isActive
          ? 'bg-success/10 text-success border-success/30'
          : 'bg-ink/5 text-ink-secondary border-ink/15'
      }`}
    >
      <span className={`w-1.5 h-1.5 ${isActive ? 'bg-success' : 'bg-ink-secondary'}`} />
      {isActive ? 'Active' : 'Completed'}
    </span>
  )
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-white border-2 border-ink/10 p-16 text-center relative">
      <div className="absolute top-3 right-3 w-6 h-6 bg-accent rotate-12" />
      <svg
        className="w-12 h-12 mx-auto text-ink-muted/40 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9 16.5l1.5 1.5 3-3M6.75 21.75h10.5a2.25 2.25 0 002.25-2.25V4.5a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v15a2.25 2.25 0 002.25 2.25z"
        />
      </svg>
      <p className="eyebrow text-ink-muted">No data</p>
      <h3 className="font-display text-lg text-ink mt-2">{title}</h3>
      <p className="text-ink-secondary text-sm mt-2 max-w-md mx-auto">{body}</p>
    </div>
  )
}

function TableSkeleton({ rows, cols }: { rows: number; cols: number }) {
  return (
    <div className="bg-white border-2 border-ink/10 shadow-card p-4 space-y-2">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-3 animate-pulse-soft">
          {Array.from({ length: cols }).map((__, c) => (
            <div key={c} className="flex-1 h-4 bg-ink/5" />
          ))}
        </div>
      ))}
    </div>
  )
}
