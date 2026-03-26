import { getFirestore } from './firebase-admin'
import { normalizePhone } from './phone'

const db = getFirestore()

export interface User {
  phone: string
  name: string
}

export interface Document {
  id: string
  title: string
  filePath: string
  uploadedAt: string
}

/**
 * Parse incoming WhatsApp webhook payload
 */
export function parseWebhookPayload(body: any): { from: string; text: string } | null {
  try {
    const entry = body?.entry?.[0]
    const change = entry?.changes?.[0]
    const message = change?.value?.messages?.[0]

    if (!message || message.type !== 'text') {
      return null
    }

    return {
      from: message.from,
      text: message.text.body,
    }
  } catch {
    return null
  }
}

/**
 * Sanitize message body
 */
export function sanitizeMessageBody(text: string): string {
  return text.trim()
}

/**
 * Find user by phone number
 */
export async function findUser(phone: string): Promise<User | null> {
  const normalizedPhone = normalizePhone(phone)
  const snapshot = await db.collection('users').where('phone', '==', normalizedPhone).limit(1).get()

  if (snapshot.empty) {
    return null
  }

  const doc = snapshot.docs[0]
  return doc.data() as User
}

/**
 * Get all documents for a user
 */
export async function getDocuments(phone: string): Promise<Document[]> {
  const normalizedPhone = normalizePhone(phone)
  const snapshot = await db
    .collection('documents')
    .where('phone', '==', normalizedPhone)
    .orderBy('uploadedAt', 'desc')
    .get()

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Document[]
}

/**
 * Session storage for document selection (in-memory)
 */
const sessions = new Map<string, Document[]>()

export function storeSession(phone: string, documents: Document[]): void {
  sessions.set(phone, documents)
}

export function getSession(phone: string): Document[] | null {
  return sessions.get(phone) || null
}
