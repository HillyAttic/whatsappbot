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

/**
 * Get documents filtered by category, fiscal year, and sub-category
 */
export async function getFilteredDocuments(
  phone: string,
  category: string,
  fiscalYear?: string,
  subCategory?: string
): Promise<Document[]> {
  const db = getFirestore()
  const normalizedPhone = normalizePhone(phone)

  let query = db
    .collection('documents')
    .where('phone', '==', normalizedPhone)
    .where('category', '==', category)

  if (fiscalYear) {
    query = query.where('fiscalYear', '==', fiscalYear)
  }

  if (subCategory) {
    query = query.where('subCategory', '==', subCategory)
  }

  const snapshot = await query.get()

  const docs = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Document[]

  return docs.sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''))
}

import type { BotSession } from './bot-flow'

export async function saveBotSession(phone: string, session: BotSession): Promise<void> {
  const db = getFirestore()
  await db.collection('sessions').doc(phone).set(session)
}

export async function getBotSession(phone: string): Promise<BotSession | null> {
  const db = getFirestore()
  const doc = await db.collection('sessions').doc(phone).get()
  if (!doc.exists) return null
  const data = doc.data() as BotSession
  if (new Date(data.expiresAt) < new Date()) {
    await doc.ref.delete()
    return null
  }
  return data
}
