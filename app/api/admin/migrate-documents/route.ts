import { NextRequest, NextResponse } from 'next/server'
import { getFirestore, getStorage } from '@/lib/firebase-admin'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth-middleware'

const db = getFirestore()

/**
 * POST /api/admin/migrate-documents - Scan Storage and create Firestore records for existing files
 * This is a one-time migration script
 */
export async function POST(req: NextRequest) {
  const auth = await verifyAdminToken(req)
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error)
  }

  try {
    const bucket = getStorage().bucket()
    
    // Get all users
    const usersSnapshot = await db.collection('users').get()
    const results = []

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data()
      const phone = userData.phone
      
      // List files in Storage for this user
      const [files] = await bucket.getFiles({
        prefix: `users/${phone}/documents/`
      })

      for (const file of files) {
        const fileName = file.name.split('/').pop() || ''
        
        // Skip if it's just the folder
        if (!fileName) continue

        // Extract timestamp and original filename
        const match = fileName.match(/^(\d+)_(.+)$/)
        const timestamp = match ? parseInt(match[1]) : Date.now()
        const originalName = match ? match[2] : fileName

        // Check if document already exists in Firestore
        const existingDocs = await db.collection('documents')
          .where('phone', '==', phone)
          .where('filePath', '==', file.name)
          .get()

        if (existingDocs.empty) {
          // Create Firestore record
          const docRef = await db.collection('documents').add({
            phone,
            title: originalName,
            filePath: file.name,
            uploadedAt: new Date(timestamp).toISOString()
          })

          results.push({
            phone,
            fileName: originalName,
            docId: docRef.id,
            status: 'created'
          })
        } else {
          results.push({
            phone,
            fileName: originalName,
            status: 'already_exists'
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      migrated: results.filter(r => r.status === 'created').length,
      skipped: results.filter(r => r.status === 'already_exists').length,
      details: results
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
