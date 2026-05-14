import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebase-admin'
import { deleteFile } from '@/lib/storage-service'
import { normalizePhone } from '@/lib/phone'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth-middleware'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/admin/clients/[id] - Update a client
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

      // Check GST uniqueness (excluding current client)
      const gstSnapshot = await db.collection('users').where('gstNumber', '==', gstNumber).limit(2).get()
      const otherClientsWithGst = gstSnapshot.docs.filter(doc => doc.id !== params.id)
      if (otherClientsWithGst.length > 0) {
        return NextResponse.json(
          { error: 'GST number already exists for another client' },
          { status: 400 }
        )
      }
    }

    // Normalize and check phone uniqueness (excluding current client)
    const normalizedPhones = phones.map(p => normalizePhone(p))
    for (const phone of normalizedPhones) {
      const phoneSnapshot = await db.collection('users').where('phones', 'array-contains', phone).limit(2).get()
      const otherClientsWithPhone = phoneSnapshot.docs.filter(doc => doc.id !== params.id)
      if (otherClientsWithPhone.length > 0) {
        return NextResponse.json(
          { error: `Phone number ${phone} already exists for another client` },
          { status: 400 }
        )
      }
    }

    const updateData: any = {
      name,
      phones: normalizedPhones,
    }

    if (gstNumber) {
      updateData.gstNumber = gstNumber
    }

    await db.collection('users').doc(params.id).update(updateData)

    return NextResponse.json({
      id: params.id,
      name,
      phones: normalizedPhones,
      gstNumber
    })
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/clients/[id] - Delete a client and cascade delete documents
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await verifyAdminToken(req)
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error)
  }

  try {
    const db = getFirestore()
    const clientDoc = await db.collection('users').doc(params.id).get()

    if (!clientDoc.exists) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    // Get all documents for this client by clientId
    const docsSnapshot = await db.collection('documents')
      .where('clientId', '==', params.id)
      .get()

    // Delete files from storage (best-effort — cannot be made atomic with Firestore)
    for (const doc of docsSnapshot.docs) {
      const data = doc.data()
      if (data.filePath) {
        try {
          await deleteFile(data.filePath)
        } catch (error) {
          console.error(`Error deleting file ${data.filePath}:`, error)
        }
      }
    }

    // Atomically delete all Firestore records in a single batch
    const batch = db.batch()
    for (const doc of docsSnapshot.docs) {
      batch.delete(doc.ref)
    }
    batch.delete(db.collection('users').doc(params.id))
    await batch.commit()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}
