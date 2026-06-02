import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebase-admin'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/reports/chat-access?limit=200
 *
 * One row per chat session (and per document access from a session).
 * Each row carries:
 *  - sessionId (phone)            ← "User No."
 *  - clientName
 *  - date / time (startedAt formatted)
 *  - timeTaken (human-readable duration)
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

    // 1. Pull chat sessions, newest first
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

    // Group access logs by phone for quick join
    const accessByPhone = new Map<string, Array<{ title: string; at: string }>>()
    for (const d of accessSnap.docs) {
      const data = d.data()
      const phone = (data.phone as string) || ''
      if (!phone) continue
      if (!accessByPhone.has(phone)) accessByPhone.set(phone, [])
      accessByPhone.get(phone)!.push({
        title: (data.documentTitle as string) || 'Untitled',
        at: (data.accessedAt as string) || '',
      })
    }

    // 3. Resolve phone -> client name (prefer session.clientName, fall back to users lookup)
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
      const endedAt = data.endedAt ? new Date(data.endedAt) : null
      const durationMs = data.durationMs ?? (endedAt ? endedAt.getTime() - startedAt.getTime() : Date.now() - startedAt.getTime())

      const docs = accessByPhone.get(phone) || []
      // Limit to 5 distinct titles for display
      const distinctTitles = Array.from(new Set(docs.map((d) => d.title))).slice(0, 5)

      const clientName = (await resolveClientName(phone, data.clientName)) || 'Unknown'

      rows.push({
        sessionId: s.id,
        phone,
        clientName,
        date: startedAt.toISOString().slice(0, 10),
        time: startedAt.toISOString().slice(11, 19),
        timeTaken: formatDuration(durationMs as number),
        durationMs: durationMs as number,
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
