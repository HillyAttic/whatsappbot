import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebase-admin'
import { normalizePhone } from '@/lib/phone'
import { deleteFile } from '@/lib/storage-service'

/**
 * PUT /api/admin/clients/[id] - Update a client
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const { name, phone } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizePhone(phone)

    const db = getFirestore()
    const docRef = db.collection('users').doc(params.id)

    await docRef.update({
      name,
      phone: normalizedPhone,
    })

    const doc = await docRef.get()

    return NextResponse.json({
      id: doc.id,
      ...doc.data(),
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
  try {
    const db = getFirestore()
    const userRef = db.collection('users').doc(params.id)
    const userDoc = await userRef.get()

    if (!userDoc.exists) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const userData = userDoc.data()
    const phone = userData?.phone

    if (!phone) {
      return NextResponse.json(
        { error: 'Client phone not found' },
        { status: 400 }
      )
    }

    // Get all documents for this client
    const documentsSnapshot = await db
      .collection('documents')
      .where('phone', '==', phone)
      .get()

    // Delete files from Storage first
    for (const doc of documentsSnapshot.docs) {
      const data = doc.data()
      if (data.filePath) {
        try {
          await deleteFile(data.filePath)
        } catch (error) {
          console.error(`Error deleting file ${data.filePath}:`, error)
          // Continue with deletion even if file delete fails
        }
      }
    }

    // Use batch to delete all documents and the user atomically
    const batch = db.batch()

    documentsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref)
    })

    batch.delete(userRef)

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
