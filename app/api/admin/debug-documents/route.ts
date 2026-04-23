import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebase-admin'
import { normalizePhone } from '@/lib/phone'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone')

  if (!phone) {
    return NextResponse.json({ error: 'Phone parameter required' }, { status: 400 })
  }

  const normalizedPhone = normalizePhone(phone)
  const db = getFirestore()

  try {
    // Check if user exists
    const userSnapshot = await db.collection('users')
      .where('phones', 'array-contains', normalizedPhone)
      .limit(1)
      .get()

    // Get all documents for this phone
    const docsSnapshot = await db.collection('documents')
      .where('phone', '==', normalizedPhone)
      .get()

    // Get sample document to check fields
    const sampleDoc = docsSnapshot.docs[0]?.data()

    return NextResponse.json({
      normalizedPhone,
      userExists: !userSnapshot.empty,
      documentCount: docsSnapshot.size,
      sampleDocument: sampleDoc || null,
      allDocumentIds: docsSnapshot.docs.map(d => d.id)
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 })
  }
}
