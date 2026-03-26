import { NextRequest, NextResponse } from 'next/server'
import { documentStorage, fileStorage } from '@/lib/simple-storage'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth-middleware'

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
    const document = await documentStorage.getById(params.docId)

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    const phone = document.phone

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

    let filePath = document.filePath

    // If a new file is provided, upload it and delete the old one
    if (file) {
      const fileBuffer = Buffer.from(await file.arrayBuffer())
      const newFilePath = await fileStorage.upload(phone, fileBuffer, file.name)

      // Delete old file
      if (document.filePath) {
        try {
          await fileStorage.delete(document.filePath)
        } catch (error) {
          console.error('Error deleting old file:', error)
        }
      }

      filePath = newFilePath
    }

    // Update document
    const updatedDoc = await documentStorage.update(params.docId, {
      title,
      filePath,
    })

    return NextResponse.json(updatedDoc)
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
    const document = await documentStorage.getById(params.docId)

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Delete file from storage
    if (document.filePath) {
      try {
        await fileStorage.delete(document.filePath)
      } catch (error) {
        console.error('Error deleting file:', error)
        return NextResponse.json(
          { error: 'Failed to delete file from storage' },
          { status: 500 }
        )
      }
    }

    // Delete document
    await documentStorage.delete(params.docId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    )
  }
}
