import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebase-admin'
import { uploadFile, deleteFile } from '@/lib/storage-service'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth-middleware'

const db = getFirestore()

/**
 * PUT /api/admin/clients/[id]/documents/[docId] - Update a document
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  const auth = await verifyAdminToken(req)
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error)
  }

  try {
    const docRef = db.collection('documents').doc(params.docId)
    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    const document = docSnap.data()
    const phone = document?.phone

    // Parse multipart form data
    const formData = await req.formData()
    const title = formData.get('title') as string
    const file = formData.get('file') as File | null

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    let filePath = document?.filePath

    // If a new file is provided, upload it and delete the old one
    if (file) {
      const fileBuffer = Buffer.from(await file.arrayBuffer())
      const timestamp = Date.now()
      const newFilePath = `users/${phone}/documents/${timestamp}_${file.name}`
      await uploadFile(fileBuffer, newFilePath, file.type)

      // Delete old file
      if (document?.filePath) {
        try {
          await deleteFile(document.filePath)
        } catch (error) {
          console.error('Error deleting old file:', error)
        }
      }

      filePath = newFilePath
    }

    // Update document
    await docRef.update({
      title,
      filePath,
    })

    return NextResponse.json({
      id: params.docId,
      phone,
      title,
      filePath,
      uploadedAt: document?.uploadedAt
    })
  } catch (error) {
    console.error('Error updating document:', error)
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/clients/[id]/documents/[docId] - Delete a document
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  const auth = await verifyAdminToken(req)
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error)
  }

  try {
    const docRef = db.collection('documents').doc(params.docId)
    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    const document = docSnap.data()

    // Delete file from storage
    if (document?.filePath) {
      try {
        await deleteFile(document.filePath)
      } catch (error) {
        console.error('Error deleting file:', error)
        return NextResponse.json(
          { error: 'Failed to delete file from storage' },
          { status: 500 }
        )
      }
    }

    // Delete document
    await docRef.delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}
