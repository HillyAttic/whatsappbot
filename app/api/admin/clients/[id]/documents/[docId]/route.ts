import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebase-admin'
import { deleteFile } from '@/lib/storage-service'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth-middleware'
import { CATEGORIES } from '@/lib/document-categories'

export const dynamic = 'force-dynamic'

/**
 * PUT /api/admin/clients/[id]/documents/[docId] - Update a document.
 *
 * Accepts JSON body with metadata. If a new file was uploaded, pass
 * the new filePath (the file should already be in Firebase Storage
 * via a signed URL from /api/admin/upload-url).
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
    const db = getFirestore()
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

    const body = await req.json()
    const title = body.title as string
    const newFilePath = body.filePath as string | undefined
    const category = body.category || document?.category
    const fiscalYear = body.fiscalYear !== undefined ? (body.fiscalYear || null) : (document?.fiscalYear ?? null)
    const subCategory = body.subCategory !== undefined ? (body.subCategory || null) : (document?.subCategory ?? null)

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (category && !CATEGORIES[category]) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      )
    }

    let filePath = document?.filePath

    // If a new file was uploaded via signed URL, delete the old one
    if (newFilePath && newFilePath !== filePath) {
      if (document?.filePath) {
        try {
          await deleteFile(document.filePath)
        } catch (error) {
          console.error('Error deleting old file:', error)
        }
      }
      filePath = newFilePath
    }

    await docRef.update({
      title,
      filePath,
      category: category ?? null,
      fiscalYear: fiscalYear ?? null,
      subCategory: subCategory ?? null,
    })

    return NextResponse.json({
      id: params.docId,
      phone,
      title,
      filePath,
      category: category ?? null,
      fiscalYear: fiscalYear ?? null,
      subCategory: subCategory ?? null,
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
    const db = getFirestore()
    const docRef = db.collection('documents').doc(params.docId)
    const docSnap = await docRef.get()

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    const document = docSnap.data()

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
