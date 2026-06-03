import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebase-admin'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000

/**
 * GET /api/admin/reports/chat-access?limit=200
 *
 * One row per chat session (and per document access from a session).
 * Each row carries:
 *  - sessionId (phone)            ← "User No."
 *  - clientName
 *  - date / time (startedAt formatted)
 *  - timeTaken (human-readable duration from start to last document access)
 *  - documentAccessed (titles, comma-separated)
 */
export async function GET(req: NextRequest) {
  const auth = await verifyAdminToken(req)
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error)
  }

  try {
    const db = getFirestore()
    const url = new URL(req.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '200', 10) || 200, 1000)

    // 1. Pull all chat sessions, newest first (now with auto-generated IDs)
    const sessionsSnap = await db
      .collection('chatSessions')
      .orderBy('lastMessageAt', 'desc')
      .limit(limit)
      .get()

    // 2. Pull document access logs, newest first
    const accessSnap = await db
      .collection('documentAccessLogs')
      .orderBy('accessedAt', 'desc')
      .limit(500)
      .get()

    // 3. Group access logs by chatSessionId (new data) and by phone (legacy fallback)
    const accessBySessionId = new Map<string, Array<{ title: string; at: string }>>()
    const accessByPhone = new Map<string, Array<{ title: string; at: string }>>()

    for (const d of accessSnap.docs) {
      const data = d.data()
      const phone = (data.phone as string) || ''
      if (!phone) continue

      const title = (data.documentTitle as string) || 'Untitled'
      const at = (data.accessedAt as string) || ''
      const entry = { title, at }

      if (data.chatSessionId) {
        if (!accessBySessionId.has(data.chatSessionId)) {
          accessBySessionId.set(data.chatSessionId, [])
        }
        accessBySessionId.get(data.chatSessionId)!.push(entry)
      } else {
        if (!accessByPhone.has(phone)) {
          accessByPhone.set(phone, [])
        }
        accessByPhone.get(phone)!.push(entry)
      }
    }

    // 4. Resolve phone -> client name (prefer session.clientName, fall back to users lookup)
    const clientCache = new Map<string, string>()
    async function resolveClientName(phone: string, fallback?: string): Promise<string | undefined> {
      if (fallback) return fallback
      if (clientCache.has(phone)) return clientCache.get(phone)
      const snap = await db
        .collection('users')
        .where('phones', 'array-contains', phone)
        .limit(1)
        .get()
      let name: string | undefined
      if (!snap.empty) {
        name = (snap.docs[0].data().name as string) || undefined
      } else {
        const legacy = await db
          .collection('users')
          .where('phone', '==', phone)
          .limit(1)
          .get()
        if (!legacy.empty) name = (legacy.docs[0].data().name as string) || undefined
      }
      clientCache.set(phone, name || '')
      return name
    }

    const rows: Array<{
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
    }> = []

    for (const s of sessionsSnap.docs) {
      const data = s.data()
      const phone = (data.phone as string) || s.id
      const startedAt = new Date(data.startedAt || data.lastMessageAt)
      const sessionStartMs = startedAt.getTime()

      // Find document accesses for this session
      let docs = accessBySessionId.get(s.id) || []

      // Legacy fallback: no chatSessionId-based matches → try phone + time window
      if (docs.length === 0 && phone) {
        const phoneDocs = accessByPhone.get(phone) || []
        const sessionEndMs = data.endedAt
          ? new Date(data.endedAt).getTime()
          : sessionStartMs + INACTIVITY_TIMEOUT_MS
        docs = phoneDocs.filter((d) => {
          const accessedAt = new Date(d.at).getTime()
          return accessedAt >= sessionStartMs && accessedAt <= sessionEndMs
        })
      }

      // Compute timeTaken: duration from session start to latest document access
      let timeTakenMs: number | null = null
      if (docs.length > 0) {
        const latestAccess = Math.max(...docs.map((d) => new Date(d.at).getTime()))
        timeTakenMs = latestAccess - sessionStartMs
      } else if (data.durationMs) {
        // Fallback: completed session with no docs — use total duration
        timeTakenMs = data.durationMs
      }
      // Active session with no docs: timeTakenMs stays null → shows '—'

      const durationMs = timeTakenMs ?? data.durationMs ?? 0

      // Limit to 5 distinct titles for display
      const distinctTitles = Array.from(new Set(docs.map((d) => d.title))).slice(0, 5)

      const clientName = (await resolveClientName(phone, data.clientName)) || 'Unknown'

      // Format in IST (UTC+5:30)
      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000
      const istDate = new Date(sessionStartMs + IST_OFFSET_MS)
      const date = istDate.toISOString().slice(0, 10)
      const time = istDate.toISOString().slice(11, 19)

      rows.push({
        sessionId: s.id,
        phone,
        clientName,
        date,
        time,
        timeTaken: formatDuration(durationMs),
        durationMs,
        documentAccessed: distinctTitles.join(', ') || '—',
        documentAccessCount: docs.length,
        status: (data.status as string) || 'active',
        startedAt: startedAt.toISOString(),
        endedAt: data.endedAt as string | undefined,
      })
    }

    return NextResponse.json({ rows })
  } catch (error) {
    console.error('Error building chat access report:', error)
    return NextResponse.json(
      { error: 'Failed to build chat access report' },
      { status: 500 }
    )
  }
}

function formatDuration(ms: number): string {
  if (!ms || ms < 0) return '—'
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}
