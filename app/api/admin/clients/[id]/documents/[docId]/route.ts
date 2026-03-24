import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebase-admin'
import { uploadFile, deleteFile } from '@/lib/storage-service'

/**
 * PUT /api/admin/clients/[id]/documents/[docId] - Update a document
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; docId: string } }
) {
  try {
    const db = getFirestore()
    
    // Get the document
    const docRef = db.collection('documents').doc(params.docId)
    const docSnapshot = await docRef.get()

    if (!docSnapshot.exists) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    const docData = docSnapshot.data()
    const phone = docData?.phone

    if (!phone) {
      return NextResponse.json(
        { error: 'Document phone not found' },
        { status: 400 }
      )
    }

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

    let filePath = docData.filePath

    // If a new file is provided, upload it and delete the old one
    if (file) {
      const fileBuffer = Buffer.from(await file.arrayBuffer())
      const newFilePath = await uploadFile(phone, fileBuffer, file.name)

      // Delete old file
      if (docData.filePath) {
        try {
          await deleteFile(docData.filePath)
        } catch (error) {
          console.error('Error deleting old file:', error)
          // Continue with update even if old file delete fails
        }
      }

      filePath = newFilePath
    }

    // Update document in Firestore
    await docRef.update({
      title,
      filePath,
    })

    const updatedDoc = await docRef.get()

    return NextResponse.json({
      id: updatedDoc.id,
      ...updatedDoc.data(),
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
  try {
    const db = getFirestore()
    const docRef = db.collection('documents').doc(params.docId)
    const docSnapshot = await docRef.get()

    if (!docSnapshot.exists) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    const docData = docSnapshot.data()

    // Delete file from Storage first
    if (docData?.filePath) {
      try {
        await deleteFile(docData.filePath)
      } catch (error) {
        console.error('Error deleting file:', error)
        return NextResponse.json(
          { error: 'Failed to delete file from storage' },
          { status: 500 }
        )
      }
    }

    // Delete document from Firestore
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
