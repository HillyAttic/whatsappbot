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
    const { name, phone } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizePhone(phone)
    await db.collection('users').doc(params.id).update({
      name,
      phone: normalizedPhone,
    })

    return NextResponse.json({
      id: params.id,
      name,
      phone: normalizedPhone
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

    const phone = clientDoc.data()?.phone

    // Get all documents for this client
    const docsSnapshot = await db.collection('documents').where('phone', '==', phone).get()

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
