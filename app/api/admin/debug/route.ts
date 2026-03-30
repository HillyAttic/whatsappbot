import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/debug - Diagnostic endpoint to check environment variables and Firebase connectivity
 * WARNING: Remove this endpoint after debugging! It exposes sensitive info.
 */
export async function GET() {
  const diagnostics: Record<string, unknown> = {}

  // 1. Check env vars exist (don't reveal values)
  const envVars = [
    'WHATSAPP_TOKEN',
    'PHONE_NUMBER_ID',
    'WEBHOOK_VERIFY_TOKEN',
    'APP_SECRET',
    'FIREBASE_SERVICE_ACCOUNT_JSON',
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
  ]

  diagnostics.envCheck = {}
  for (const key of envVars) {
    const value = process.env[key]
    ;(diagnostics.envCheck as Record<string, string>)[key] = value
      ? `SET (${value.length} chars)`
      : 'MISSING'
  }

  // 2. Check FIREBASE_SERVICE_ACCOUNT_JSON parsing
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson)
      diagnostics.serviceAccountParsing = 'SUCCESS'
      diagnostics.serviceAccountKeys = Object.keys(parsed)
      diagnostics.projectId = parsed.project_id || 'MISSING'
      diagnostics.clientEmail = parsed.client_email ? 'SET' : 'MISSING'
      diagnostics.privateKeyPresent = parsed.private_key ? 'SET' : 'MISSING'
      diagnostics.privateKeyLength = parsed.private_key?.length || 0
      diagnostics.privateKeyStartsWith = parsed.private_key?.substring(0, 30) || 'N/A'
      diagnostics.privateKeyContainsNewlines = parsed.private_key?.includes('\n') || false
      diagnostics.privateKeyContainsEscapedNewlines = parsed.private_key?.includes('\\n') || false
    } catch (error) {
      diagnostics.serviceAccountParsing = 'FAILED'
      diagnostics.parseError = error instanceof Error ? error.message : String(error)
      diagnostics.jsonFirst100Chars = serviceAccountJson.substring(0, 100)
      diagnostics.jsonLast50Chars = serviceAccountJson.substring(serviceAccountJson.length - 50)
    }
  }

  // 3. Try initializing Firebase
  try {
    const { getFirestore } = await import('@/lib/firebase-admin')
    const db = getFirestore()
    diagnostics.firestoreInit = 'SUCCESS'

    // 4. Try a simple read
    try {
      const snapshot = await db.collection('users').limit(1).get()
      diagnostics.firestoreRead = 'SUCCESS'
      diagnostics.sampleDocCount = snapshot.size
    } catch (readError) {
      diagnostics.firestoreRead = 'FAILED'
      diagnostics.readError = readError instanceof Error ? readError.message : String(readError)
    }
  } catch (initError) {
    diagnostics.firestoreInit = 'FAILED'
    diagnostics.initError = initError instanceof Error ? initError.message : String(initError)
    diagnostics.initErrorStack = initError instanceof Error ? initError.stack : undefined
  }

  return NextResponse.json(diagnostics, { status: 200 })
}
