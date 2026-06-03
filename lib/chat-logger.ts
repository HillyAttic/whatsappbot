import { getFirestore } from './firebase-admin'
import { normalizePhone } from './phone'

/**
 * Chat session record — one per distinct user "visit" (from first message
 * to inactivity / explicit close). Documents use auto-generated IDs so
 * multiple sessions per phone are preserved.
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
  chatSessionId?: string
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
 * Find the active chat session document ID for a phone number.
 * Returns null if no active session exists.
 */
async function findActiveSessionId(phone: string): Promise<string | null> {
  const db = getFirestore()
  const normalized = normalizePhone(phone)
  const snap = await db
    .collection('chatSessions')
    .where('phone', '==', normalized)
    .where('status', '==', 'active')
    .orderBy('lastMessageAt', 'desc')
    .limit(1)
    .get()
  return snap.empty ? null : snap.docs[0].id
}

/**
 * Record a message from a phone number. Creates a new chat session if the
 * previous one is missing, ended, or older than the inactivity threshold;
 * otherwise appends to the existing one.
 *
 * Returns the chat session document ID.
 */
export async function recordChatActivity(
  phone: string,
  fields: { clientId?: string; clientName?: string }
): Promise<string | null> {
  try {
    const db = getFirestore()
    const normalized = normalizePhone(phone)
    const now = new Date()
    const nowIso = now.toISOString()

    // Find the current active session via query (not doc ID)
    const activeSnap = await db
      .collection('chatSessions')
      .where('phone', '==', normalized)
      .where('status', '==', 'active')
      .orderBy('lastMessageAt', 'desc')
      .limit(1)
      .get()

    if (!activeSnap.empty) {
      const sessionDoc = activeSnap.docs[0]
      const data = sessionDoc.data() as ChatSessionLog
      const last = new Date(data.lastMessageAt).getTime()

      if (now.getTime() - last < INACTIVITY_TIMEOUT_MS) {
        // Append to existing active session
        await sessionDoc.ref.update({
          lastMessageAt: nowIso,
          messageCount: (data.messageCount || 0) + 1,
          // Lock in the client if it was previously unknown
          ...(data.clientId ? {} : { clientId: fields.clientId, clientName: fields.clientName }),
        })
        return sessionDoc.id
      }

      // Stale active session — close it out before opening a new one
      await closeChatSession(normalized)
    }

    // New session with auto-generated ID
    const newSession: ChatSessionLog = {
      phone: normalized,
      clientId: fields.clientId,
      clientName: fields.clientName,
      startedAt: nowIso,
      status: 'active',
      messageCount: 1,
      lastMessageAt: nowIso,
    }
    const docRef = await db.collection('chatSessions').add(newSession)
    return docRef.id
  } catch (error) {
    // Logger must never break the bot — swallow errors with a console note
    console.error('[chat-logger] recordChatActivity failed:', error)
    return null
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

    const activeSnap = await db
      .collection('chatSessions')
      .where('phone', '==', normalized)
      .where('status', '==', 'active')
      .orderBy('lastMessageAt', 'desc')
      .limit(1)
      .get()

    if (activeSnap.empty) return

    const sessionDoc = activeSnap.docs[0]
    const data = sessionDoc.data() as ChatSessionLog
    const now = new Date()
    const startedAt = new Date(data.startedAt).getTime()
    const endedAt = now.toISOString()

    await sessionDoc.ref.update({
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
    const normalized = normalizePhone(entry.phone)

    // Resolve the active chat session ID for this phone
    const chatSessionId = await findActiveSessionId(normalized)

    const payload: DocumentAccessLog = {
      ...entry,
      phone: normalized,
      ...(chatSessionId ? { chatSessionId } : {}),
    }
    await db.collection('documentAccessLogs').add(payload)
  } catch (error) {
    console.error('[chat-logger] recordDocumentAccess failed:', error)
  }
}
