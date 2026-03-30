import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebase-admin'
import { generateSignedUrl } from '@/lib/storage-service'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/documents/[id]/download-url - Get a signed download URL for a document
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAdminToken(req)
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error)
  }

  try {
    const db = getFirestore()
    const docRef = await db.collection('documents').doc(params.id).get()

    if (!docRef.exists) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    const docData = docRef.data()
    const filePath = docData?.filePath

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path not found' },
        { status: 404 }
      )
    }

    const downloadUrl = await generateSignedUrl(filePath)

    return NextResponse.json({ url: downloadUrl })
  } catch (error) {
    console.error('Error generating download URL:', error)
    return NextResponse.json(
      { error: 'Failed to generate download URL' },
      { status: 500 }
    )
  }
}
