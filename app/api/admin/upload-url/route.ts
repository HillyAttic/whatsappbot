import { NextRequest, NextResponse } from 'next/server'
import { getStorage } from '@/lib/firebase-admin'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/upload-url - Generate a signed URL for direct file upload to Firebase Storage.
 * This bypasses Vercel's 4.5 MB request body limit by letting the client upload directly.
 */
export async function POST(req: NextRequest) {
  const auth = await verifyAdminToken(req)
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error)
  }

  try {
    const { filePath, contentType } = await req.json()

    if (!filePath) {
      return NextResponse.json({ error: 'filePath is required' }, { status: 400 })
    }

    const bucket = getStorage().bucket()
    const file = bucket.file(filePath)

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType: contentType || 'application/octet-stream',
    })

    return NextResponse.json({ url, filePath })
  } catch (error) {
    console.error('Error generating upload URL:', error)
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 })
  }
}
