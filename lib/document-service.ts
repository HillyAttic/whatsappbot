import { getFirestore } from './firebase-admin'
import { normalizePhone } from './phone'

// In-memory cache for categories (survives within same serverless instance)
interface CategoriesCache {
  data: Record<string, { fiscalYears: string[]; subCategories: string[] }> | null
  timestamp: number
  loading: Promise<Record<string, { fiscalYears: string[]; subCategories: string[] }>> | null
}

const categoriesCache: CategoriesCache = {
  data: null,
  timestamp: 0,
  loading: null
}

const CATEGORIES_TTL_MS = 30 * 60 * 1000 // 30 minutes

// In-memory LRU cache for user lookups
interface UserCacheEntry {
  user: User | null
  timestamp: number
}

const userCache = new Map<string, UserCacheEntry>()
const USER_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const USER_CACHE_MAX_SIZE = 100 // ~1MB max

export interface User {
  phones: string[]
  name: string
  gstNumber?: string
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
export function parseWebhookPayload(
  body: any
): { from: string; text: string; messageId: string; interactiveReplyId?: string } | null {
  try {
    const entry = body?.entry?.[0]
    const change = entry?.changes?.[0]
    const message = change?.value?.messages?.[0]

    if (!message) return null

    const messageId = message.id as string

    if (message.type === 'text') {
      return {
        from: message.from,
        messageId,
        text: message.text.body,
      }
    }

    if (message.type === 'interactive') {
      const interactive = message.interactive
      if (interactive?.type === 'button_reply') {
        return {
          from: message.from,
          messageId,
          text: interactive.button_reply.title,
          interactiveReplyId: interactive.button_reply.id,
        }
      }
      if (interactive?.type === 'list_reply') {
        return {
          from: message.from,
          messageId,
          text: interactive.list_reply.title,
          interactiveReplyId: interactive.list_reply.id,
        }
      }
    }

    return null
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
 * Find user by phone number with in-memory caching
 */
export async function findUser(phone: string): Promise<User | null> {
  const normalizedPhone = normalizePhone(phone)
  const now = Date.now()

  // Check cache
  const cached = userCache.get(normalizedPhone)
  if (cached && (now - cached.timestamp) < USER_CACHE_TTL_MS) {
    console.log('[findUser] Cache HIT for', normalizedPhone.slice(-4))
    return cached.user
  }

  console.log('[findUser] Cache MISS for', normalizedPhone.slice(-4))

  const db = getFirestore()

  // Try new format (phones array)
  let snapshot = await db.collection('users').where('phones', 'array-contains', normalizedPhone).limit(1).get()

  // Fallback to old format (phone string) for backward compatibility
  if (snapshot.empty) {
    snapshot = await db.collection('users').where('phone', '==', normalizedPhone).limit(1).get()
  }

  let user: User | null = null

  if (!snapshot.empty) {
    const doc = snapshot.docs[0]
    const data = doc.data()

    // Normalize to new format
    user = {
      phones: data.phones || (data.phone ? [data.phone] : []),
      name: data.name,
      gstNumber: data.gstNumber
    }
  }

  // Cache the result (including null for non-existent users)
  userCache.set(normalizedPhone, { user, timestamp: now })

  // LRU eviction: remove oldest entries if cache is too large
  if (userCache.size > USER_CACHE_MAX_SIZE) {
    const oldestKey = userCache.keys().next().value
    if (oldestKey) {
      userCache.delete(oldestKey)
      console.log('[findUser] Evicted oldest cache entry')
    }
  }

  return user
}

/**
 * Get all documents for a user
 */
export async function getDocuments(phone: string): Promise<Document[]> {
  const db = getFirestore()
  const normalizedPhone = normalizePhone(phone)

  console.log('[getDocuments] Fetching documents for phone:', normalizedPhone)

  try {
    // First, find the user to get all their phone numbers
    const user = await findUser(normalizedPhone)

    if (!user || !user.phones || user.phones.length === 0) {
      console.log('[getDocuments] User not found or has no phone numbers')
      return []
    }

    // Query documents for all phone numbers associated with this user
    const phoneQueries = user.phones.map(userPhone =>
      db.collection('documents')
        .where('phone', '==', userPhone)
        .get()
    )

    const snapshots = await Promise.all(phoneQueries)

    // Combine all documents and deduplicate by ID
    const documentsMap = new Map()
    snapshots.forEach(snapshot => {
      snapshot.docs.forEach(doc => {
        if (!documentsMap.has(doc.id)) {
          documentsMap.set(doc.id, {
            id: doc.id,
            ...doc.data(),
          })
        }
      })
    })

    const documents = Array.from(documentsMap.values()) as Document[]

    // Sort by uploadedAt descending
    documents.sort((a, b) => {
      const dateA = new Date(a.uploadedAt || 0).getTime()
      const dateB = new Date(b.uploadedAt || 0).getTime()
      return dateB - dateA
    })

    console.log('[getDocuments] Found', documents.length, 'documents across', user.phones.length, 'phone numbers')

    return documents
  } catch (error) {
    console.error('[getDocuments] ERROR:', error)
    console.error('[getDocuments] Phone:', normalizedPhone)
    throw error
  }
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

  console.log('[getFilteredDocuments] Query params:', {
    normalizedPhone,
    category,
    fiscalYear,
    subCategory
  })

  try {
    // First, find the user to get all their phone numbers
    const user = await findUser(normalizedPhone)

    if (!user || !user.phones || user.phones.length === 0) {
      console.log('[getFilteredDocuments] User not found or has no phone numbers')
      return []
    }

    // Build queries for all phone numbers
    const phoneQueries = user.phones.map(userPhone => {
      let query: any = db.collection('documents')
        .where('phone', '==', userPhone)
        .where('category', '==', category)

      if (fiscalYear) {
        query = query.where('fiscalYear', '==', fiscalYear)
      }

      if (subCategory) {
        query = query.where('subCategory', '==', subCategory)
      }

      return query.get()
    })

    const snapshots = await Promise.all(phoneQueries)

    // Combine all documents and deduplicate by ID
    const documentsMap = new Map()
    snapshots.forEach(snapshot => {
      snapshot.docs.forEach(doc => {
        if (!documentsMap.has(doc.id)) {
          documentsMap.set(doc.id, {
            id: doc.id,
            ...doc.data(),
          })
        }
      })
    })

    const documents = Array.from(documentsMap.values()) as Document[]

    // Sort by uploadedAt descending
    documents.sort((a, b) => {
      const dateA = new Date(a.uploadedAt || 0).getTime()
      const dateB = new Date(b.uploadedAt || 0).getTime()
      return dateB - dateA
    })

    console.log('[getFilteredDocuments] Found', documents.length, 'documents')

    return documents
  } catch (error) {
    console.error('[getFilteredDocuments] ERROR:', error)
    console.error('[getFilteredDocuments] Query params:', {
      normalizedPhone,
      category,
      fiscalYear,
      subCategory
    })
    throw error
  }
}
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

    console.log('[getFilteredDocuments] Found', snapshot.size, 'documents')

    const docs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Document[]

    return docs.sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''))
  } catch (error) {
    console.error('[getFilteredDocuments] ERROR:', error)
    console.error('[getFilteredDocuments] Query params:', {
      normalizedPhone,
      category,
      fiscalYear,
      subCategory
    })
    throw error
  }
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

/**
 * Get dynamic categories configuration from Firestore with in-memory caching
 * Falls back to static CATEGORIES if Firestore config is empty
 */
export async function getCategories(): Promise<Record<string, { fiscalYears: string[]; subCategories: string[] }>> {
  const now = Date.now()

  // Return cached data if still valid
  if (categoriesCache.data && (now - categoriesCache.timestamp) < CATEGORIES_TTL_MS) {
    console.log('[getCategories] Returning CACHED categories (age:', Math.floor((now - categoriesCache.timestamp) / 1000), 'seconds)')
    return categoriesCache.data
  }

  // If already loading, wait for that promise (prevents duplicate fetches)
  if (categoriesCache.loading) {
    console.log('[getCategories] Waiting for in-flight request')
    return categoriesCache.loading
  }

  // Start loading
  console.log('[getCategories] Cache miss or expired, fetching from Firestore')
  categoriesCache.loading = fetchCategoriesFromFirestore()

  try {
    const result = await categoriesCache.loading
    categoriesCache.data = result
    categoriesCache.timestamp = now
    console.log('[getCategories] Cache updated with', Object.keys(result).length, 'categories')
    return result
  } finally {
    categoriesCache.loading = null
  }
}

/**
 * Internal function to fetch categories from Firestore
 */
async function fetchCategoriesFromFirestore(): Promise<Record<string, { fiscalYears: string[]; subCategories: string[] }>> {
  try {
    const db = getFirestore()
    console.log('[fetchCategoriesFromFirestore] Reading config/categories...')
    const doc = await db.collection('config').doc('categories').get()

    console.log('[fetchCategoriesFromFirestore] Doc exists:', doc.exists)

    if (doc.exists) {
      const data = doc.data()
      const categoryKeys = data?.categories ? Object.keys(data.categories) : []
      console.log('[fetchCategoriesFromFirestore] Category keys:', categoryKeys)

      if (data?.categories && categoryKeys.length > 0) {
        console.log('[fetchCategoriesFromFirestore] Returning', categoryKeys.length, 'categories from Firestore')
        return data.categories
      } else {
        console.warn('[fetchCategoriesFromFirestore] Doc exists but categories empty')
      }
    } else {
      console.warn('[fetchCategoriesFromFirestore] Doc does NOT exist')
    }
  } catch (error) {
    console.error('[fetchCategoriesFromFirestore] ERROR:', error instanceof Error ? error.message : error)
    console.error('[fetchCategoriesFromFirestore] Stack:', error instanceof Error ? error.stack : 'N/A')
  }

  // Fallback to static config
  const { CATEGORIES } = await import('./document-categories')
  console.log('[fetchCategoriesFromFirestore] Using FALLBACK static CATEGORIES with', Object.keys(CATEGORIES).length, 'categories')
  return CATEGORIES
}

/**
 * Invalidate categories cache (call when categories are updated in Firestore)
 */
export function invalidateCategoriesCache(): void {
  console.log('[invalidateCategoriesCache] Clearing cache')
  categoriesCache.data = null
  categoriesCache.timestamp = 0
  categoriesCache.loading = null
}
