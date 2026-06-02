import { getFirestore } from './firebase-admin'
import { normalizePhone } from './phone'

/**
 * Chat session record — one per distinct user "visit" (from first message
 * to inactivity / explicit close).
 */
export interface ChatSessionLog {
  phone: string
  clientId?: string
  clientName?: string
  startedAt: string
  endedAt?: string
  durationMs?: number
  status: 'active' | 'completed'
  messageCount: number
  lastMessageAt: string
}

/**
 * Document access record — written every time the bot generates a signed
 * URL for a document and sends it to the user.
 */
export interface DocumentAccessLog {
  phone: string
  clientId?: string
  clientName?: string
  documentId: string
  documentTitle: string
  category?: string
  fiscalYear?: string | null
  subCategory?: string | null
  accessedAt: string
  source: 'whatsapp' | 'admin'
}

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000 // 30 min — matches session expiry

/**
 * Record a message from a phone number. Creates a new chat session if the
 * previous one is missing, ended, or older than the inactivity threshold;
 * otherwise appends to the existing one.
 */
export async function recordChatActivity(
  phone: string,
  fields: { clientId?: string; clientName?: string }
): Promise<void> {
  try {
    const db = getFirestore()
    const normalized = normalizePhone(phone)
    const now = new Date()
    const nowIso = now.toISOString()

    const sessionRef = db.collection('chatSessions').doc(normalized)
    const sessionDoc = await sessionRef.get()
    const data = sessionDoc.exists ? (sessionDoc.data() as ChatSessionLog) : null

    if (data && data.status === 'active') {
      const last = new Date(data.lastMessageAt).getTime()
      if (now.getTime() - last < INACTIVITY_TIMEOUT_MS) {
        // Append to existing active session
        await sessionRef.update({
          lastMessageAt: nowIso,
          messageCount: (data.messageCount || 0) + 1,
          // Lock in the client if it was previously unknown
          ...(data.clientId ? {} : { clientId: fields.clientId, clientName: fields.clientName }),
        })
        return
      }

      // Stale active session — close it out before opening a new one
      await closeChatSession(normalized)
    }

    // New session
    const newSession: ChatSessionLog = {
      phone: normalized,
      clientId: fields.clientId,
      clientName: fields.clientName,
      startedAt: nowIso,
      status: 'active',
      messageCount: 1,
      lastMessageAt: nowIso,
    }
    await sessionRef.set(newSession)
  } catch (error) {
    // Logger must never break the bot — swallow errors with a console note
    console.error('[chat-logger] recordChatActivity failed:', error)
  }
}

/**
 * Mark the active chat session for a phone as completed. Safe to call when
 * there is no active session.
 */
export async function closeChatSession(phone: string): Promise<void> {
  try {
    const db = getFirestore()
    const normalized = normalizePhone(phone)
    const sessionRef = db.collection('chatSessions').doc(normalized)
    const sessionDoc = await sessionRef.get()
    if (!sessionDoc.exists) return

    const data = sessionDoc.data() as ChatSessionLog
    if (data.status !== 'active') return

    const now = new Date()
    const startedAt = new Date(data.startedAt).getTime()
    const endedAt = now.toISOString()

    await sessionRef.update({
      status: 'completed',
      endedAt,
      durationMs: Math.max(0, now.getTime() - startedAt),
      lastMessageAt: endedAt,
    })
  } catch (error) {
    console.error('[chat-logger] closeChatSession failed:', error)
  }
}

/**
 * Record that a document was delivered to (or downloaded by) a user.
 * Each delivery is a separate log entry — useful for the
 * "doc report accessed" column in the report.
 */
export async function recordDocumentAccess(entry: DocumentAccessLog): Promise<void> {
  try {
    const db = getFirestore()
    const payload: DocumentAccessLog = {
      ...entry,
      phone: normalizePhone(entry.phone),
    }
    await db.collection('documentAccessLogs').add(payload)
  } catch (error) {
    console.error('[chat-logger] recordDocumentAccess failed:', error)
  }
}
