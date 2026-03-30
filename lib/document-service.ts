import { getFirestore } from './firebase-admin'
import { normalizePhone } from './phone'

export interface User {
  phone: string
  name: string
}

export interface Document {
  id: string
  title: string
  filePath: string
  uploadedAt: string
  category?: string
  fiscalYear?: string | null
  subCategory?: string | null
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
  const db = getFirestore()
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
  const db = getFirestore()
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

const SESSION_TTL_MS = 30 * 60 * 1000 // 30 minutes

export async function storeSession(phone: string, documents: Document[]): Promise<void> {
  const db = getFirestore()
  const now = Date.now()
  await db.collection('sessions').doc(phone).set({
    documentList: documents,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
  })
}

export async function getSession(phone: string): Promise<Document[] | null> {
  const db = getFirestore()
  const doc = await db.collection('sessions').doc(phone).get()
  if (!doc.exists) return null
  const data = doc.data()!
  if (new Date(data.expiresAt) < new Date()) {
    await doc.ref.delete()
    return null
  }
  return data.documentList as Document[]
}
