import { getFirestore } from '../lib/firebase-admin'

interface MigrationResults {
  success: number
  alreadyMigrated: number
  orphaned: number
  multipleClients: number
  errors: number
}

interface OrphanedDoc {
  id: string
  phone?: string
  title: string
}

interface MultipleClientDoc {
  id: string
  phone: string
  title: string
  clients: Array<{ id: string; name: string }>
}

/**
 * Migration script to add clientId to existing documents
 *
 * Strategy:
 * 1. Read all documents from Firestore
 * 2. For each document, find the client by phone number
 * 3. Add clientId field to document
 * 4. Handle edge cases (orphaned documents, multiple clients)
 */
export async function migrateAddClientId() {
  const db = getFirestore()

  console.log('Starting migration: Add clientId to documents')

  // Get all documents
  const docsSnapshot = await db.collection('documents').get()
  console.log(`Found ${docsSnapshot.size} documents to migrate`)

  const results: MigrationResults = {
    success: 0,
    alreadyMigrated: 0,
    orphaned: 0,
    multipleClients: 0,
    errors: 0
  }

  const orphanedDocs: OrphanedDoc[] = []
  const multipleClientDocs: MultipleClientDoc[] = []

  // Process in batches of 500 (Firestore batch limit)
  const batchSize = 500
  let batch = db.batch()
  let batchCount = 0

  for (const doc of docsSnapshot.docs) {
    const data = doc.data()

    // Skip if already has clientId
    if (data.clientId) {
      results.alreadyMigrated++
      continue
    }

    const phone = data.phone

    if (!phone) {
      console.warn(`Document ${doc.id} has no phone field`)
      results.orphaned++
      orphanedDocs.push({ id: doc.id, title: data.title })
      continue
    }

    // Find client by phone number
    const clientSnapshot = await db.collection('users')
      .where('phones', 'array-contains', phone)
      .get()

    if (clientSnapshot.empty) {
      // No client found - orphaned document
      console.warn(`No client found for phone ${phone} (doc ${doc.id})`)
      results.orphaned++
      orphanedDocs.push({ id: doc.id, phone, title: data.title })
      continue
    }

    if (clientSnapshot.size > 1) {
      // Multiple clients with same phone - data integrity issue
      console.error(`Multiple clients found for phone ${phone} (doc ${doc.id})`)
      results.multipleClients++
      multipleClientDocs.push({
        id: doc.id,
        phone,
        title: data.title,
        clients: clientSnapshot.docs.map(c => ({ id: c.id, name: c.data().name }))
      })
      continue
    }

    // Found exactly one client - update document
    const clientId = clientSnapshot.docs[0].id
    batch.update(doc.ref, { clientId })
    batchCount++
    results.success++

    // Commit batch if it reaches 500
    if (batchCount >= batchSize) {
      await batch.commit()
      console.log(`Committed batch of ${batchCount} documents`)
      batch = db.batch()
      batchCount = 0
    }
  }

  // Commit remaining documents
  if (batchCount > 0) {
    await batch.commit()
    console.log(`Committed final batch of ${batchCount} documents`)
  }

  console.log('\nMigration complete!')
  console.log('Results:', results)

  if (orphanedDocs.length > 0) {
    console.log('\nOrphaned documents (no client found):')
    console.log(JSON.stringify(orphanedDocs, null, 2))
  }

  if (multipleClientDocs.length > 0) {
    console.log('\nDocuments with multiple clients (data integrity issue):')
    console.log(JSON.stringify(multipleClientDocs, null, 2))
  }

  return { results, orphanedDocs, multipleClientDocs }
}
