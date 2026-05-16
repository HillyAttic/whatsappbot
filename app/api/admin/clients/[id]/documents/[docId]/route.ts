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
    console.log('PUT document body:', body)
    
    const title = body.title as string
    const newFilePath = body.filePath as string | undefined
    // Handle category: if provided in body (even as empty string), use it; otherwise keep existing
    const category = body.category !== undefined ? (body.category || null) : (document?.category ?? null)
    const fiscalYear = body.fiscalYear !== undefined ? (body.fiscalYear || null) : (document?.fiscalYear ?? null)
    const subCategory = body.subCategory !== undefined ? (body.subCategory || null) : (document?.subCategory ?? null)

    console.log('Processed values:', { title, category, fiscalYear, subCategory })

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Load categories from database to validate against current categories
    let validCategories = CATEGORIES
    try {
      const categoriesDoc = await db.collection('config').doc('categories').get()
      if (categoriesDoc.exists && categoriesDoc.data()?.categories) {
        validCategories = categoriesDoc.data()!.categories
      }
    } catch (error) {
      console.warn('Could not load categories from database, using defaults:', error)
    }

    // Validate category only if it's not null/empty
    if (category && !validCategories[category]) {
      return NextResponse.json(
        { error: `Invalid category: ${category}. Valid categories are: ${Object.keys(validCategories).join(', ')}` },
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
    const errorMessage = error instanceof Error ? error.message : 'Failed to update document'
    return NextResponse.json(
      { error: 'Failed to update document', details: errorMessage },
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
