import { getFirestore } from './firebase-admin'
import { normalizePhone } from './phone'

export interface UserRecord {
  id: string
  name: string
  phone: string
}

export interface DocumentRecord {
  id: string
  phone: string
  title: string
  filePath: string
}

// In-memory session store: Map<phone, DocumentRecord[]>
const sessions = new Map<string, DocumentRecord[]>()

/**
 * Parses a WhatsApp webhook payload to extract sender phone and message text.
 * @param body - The webhook payload object
 * @returns Object with from and text, or null if no messages present
 */
export function parseWebhookPayload(body: any): { from: string; text: string } | null {
  try {
    const messages = body?.entry?.[0]?.changes?.[0]?.value?.messages
    if (!messages || messages.length === 0) {
      return null
    }

    const from = messages[0]?.from
    const text = messages[0]?.text?.body

    if (!from || !text) {
      return null
    }

    return { from, text }
  } catch (error) {
    return null
  }
}

/**
 * Sanitizes message body by removing non-alphanumeric characters (except spaces and punctuation)
 * and truncating to 256 characters.
 * @param text - The raw message text
 * @returns Sanitized text
 */
export function sanitizeMessageBody(text: string): string {
  // Allow alphanumeric, spaces, and standard punctuation
  const sanitized = text.replace(/[^a-zA-Z0-9\s.,!?;:'"()-]/g, '')
  return sanitized.slice(0, 256)
}

/**
 * Finds a user by phone number in Firestore.
 * @param phone - The normalized phone number
 * @returns UserRecord or null if not found
 */
export async function findUser(phone: string): Promise<UserRecord | null> {
  const db = getFirestore()
  const snapshot = await db.collection('users').where('phone', '==', phone).limit(1).get()

  if (snapshot.empty) {
    return null
  }

  const doc = snapshot.docs[0]
  return {
    id: doc.id,
    ...doc.data(),
  } as UserRecord
}

/**
 * Gets documents for a user by phone number.
 * @param phone - The normalized phone number
 * @returns Array of up to 5 DocumentRecords
 */
export async function getDocuments(phone: string): Promise<DocumentRecord[]> {
  const db = getFirestore()
  const snapshot = await db
    .collection('documents')
    .where('phone', '==', phone)
    .limit(5)
    .get()

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as DocumentRecord))
}

/**
 * Stores a session for a user.
 * @param phone - The normalized phone number
 * @param documents - The documents to store in the session
 */
export function storeSession(phone: string, documents: DocumentRecord[]): void {
  sessions.set(phone, documents)
}

/**
 * Gets a session for a user.
 * @param phone - The normalized phone number
 * @returns The stored documents or undefined if no session exists
 */
export function getSession(phone: string): DocumentRecord[] | undefined {
  return sessions.get(phone)
}
