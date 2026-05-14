import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebase-admin'
import { uploadFile } from '@/lib/storage-service'
import { normalizePhone } from '@/lib/phone'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth-middleware'
import { getClientFolderPaths } from '@/lib/document-categories'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/clients - List all clients
 */
export async function GET(req: NextRequest) {
  const auth = await verifyAdminToken(req)
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error)
  }

  try {
    const db = getFirestore()
    const snapshot = await db.collection('users').get()
    const clients = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    return NextResponse.json(clients)
  } catch (error) {
    console.error('Error fetching clients:', error)
    return NextResponse.json(
      { error: 'Failed to fetch clients' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/clients - Create a new client
 */
export async function POST(req: NextRequest) {
  const auth = await verifyAdminToken(req)
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error)
  }

  try {
    const db = getFirestore()
    const body = await req.json()
    const { name, phones, gstNumber } = body

    if (!name || !phones || !Array.isArray(phones) || phones.length === 0) {
      return NextResponse.json(
        { error: 'Name and at least one phone number are required' },
        { status: 400 }
      )
    }

    // Validate GST format if provided
    if (gstNumber) {
      const gstPattern = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
      if (gstNumber.length !== 15 || !gstPattern.test(gstNumber)) {
        return NextResponse.json(
          { error: 'Invalid GST number format' },
          { status: 400 }
        )
      }

      // Check GST uniqueness
      const gstSnapshot = await db.collection('users').where('gstNumber', '==', gstNumber).limit(1).get()
      if (!gstSnapshot.empty) {
        return NextResponse.json(
          { error: 'GST number already exists for another client' },
          { status: 400 }
        )
      }
    }

    // Normalize phones
    const normalizedPhones = phones.map(p => normalizePhone(p))

    const docData: any = {
      name,
      phones: normalizedPhones,
      createdAt: new Date().toISOString()
    }

    if (gstNumber) {
      docData.gstNumber = gstNumber
    }

    const docRef = await db.collection('users').add(docData)

    // Scaffold the JPCO folder structure in Firebase Storage
    const placeholder = Buffer.from('')
    const folderPaths = getClientFolderPaths(name)
    await Promise.all(
      folderPaths.map(p => uploadFile(placeholder, p, 'application/octet-stream'))
    )

    return NextResponse.json({
      id: docRef.id,
      name,
      phones: normalizedPhones,
      gstNumber
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating client:', error)
    return NextResponse.json(
      { error: 'Failed to create client' },
      { status: 500 }
    )
  }
}
