import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth-middleware'
import { migrateAddClientId } from '@/scripts/migrate-add-clientid'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for migration

/**
 * POST /api/admin/migrate-add-clientid
 *
 * Adds clientId field to all existing documents
 * This is a one-time migration script
 */
export async function POST(req: NextRequest) {
  const auth = await verifyAdminToken(req)
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error)
  }

  try {
    const result = await migrateAddClientId()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
