import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/test-firebase - Test Firebase connection
 */
export async function GET(req: NextRequest) {
  const auth = await verifyAdminToken(req)
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error)
  }

  const results: any = {
    timestamp: new Date().toISOString(),
    tests: {}
  }

  // Test 1: Check environment variables
  results.tests.envVars = {
    FIREBASE_SERVICE_ACCOUNT_JSON: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  }

  // Test 2: Try to initialize Firebase
  try {
    const { getFirestore } = await import('@/lib/firebase-admin')
    const db = getFirestore()
    results.tests.firebaseInit = 'SUCCESS'

    // Test 3: Try to read from Firestore
    try {
      const usersSnapshot = await db.collection('users').limit(5).get()
      results.tests.firestoreRead = {
        status: 'SUCCESS',
        userCount: usersSnapshot.size,
        users: usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      }
    } catch (readError) {
      results.tests.firestoreRead = {
        status: 'FAILED',
        error: readError instanceof Error ? readError.message : String(readError)
      }
    }

    // Test 4: Try to read documents
    try {
      const docsSnapshot = await db.collection('documents').limit(5).get()
      results.tests.documentsRead = {
        status: 'SUCCESS',
        docCount: docsSnapshot.size,
        documents: docsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      }
    } catch (readError) {
      results.tests.documentsRead = {
        status: 'FAILED',
        error: readError instanceof Error ? readError.message : String(readError)
      }
    }
  } catch (initError) {
    results.tests.firebaseInit = {
      status: 'FAILED',
      error: initError instanceof Error ? initError.message : String(initError),
      stack: initError instanceof Error ? initError.stack : undefined
    }
  }

  return NextResponse.json(results, { status: 200 })
}
