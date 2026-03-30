import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebase-admin'
import { uploadFile } from '@/lib/storage-service'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth-middleware'
import { CATEGORIES, buildStoragePath } from '@/lib/document-categories'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/clients/[id]/documents - List all documents for a client
 */
export async function GET(
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

    const snapshot = await db.collection('documents')
      .where('phone', '==', phone)
      .get()

    const documents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    documents.sort((a: any, b: any) => {
      const dateA = new Date(a.uploadedAt || 0).getTime()
      const dateB = new Date(b.uploadedAt || 0).getTime()
      return dateB - dateA
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/clients/[id]/documents - Create a new document with file upload
 */
export async function POST(
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
    const clientName = clientDoc.data()?.name

    const formData = await req.formData()
    const title = formData.get('title') as string
    const file = formData.get('file') as File
    const category = formData.get('category') as string
    const fiscalYear = (formData.get('fiscalYear') as string) || null
    const subCategory = (formData.get('subCategory') as string) || null

    if (!title || !file) {
      return NextResponse.json(
        { error: 'Title and file are required' },
        { status: 400 }
      )
    }

    if (!category || !CATEGORIES[category]) {
      return NextResponse.json(
        { error: 'Valid category is required' },
        { status: 400 }
      )
    }

    const catConfig = CATEGORIES[category]

    if (catConfig.fiscalYears.length > 0 && !fiscalYear) {
      return NextResponse.json(
        { error: 'Fiscal year is required for this category' },
        { status: 400 }
      )
    }

    if (catConfig.subCategories.length > 0 && !subCategory) {
      return NextResponse.json(
        { error: 'Sub-category is required for this category' },
        { status: 400 }
      )
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const filePath = buildStoragePath(clientName, category, fiscalYear, subCategory, file.name)
    await uploadFile(fileBuffer, filePath, file.type)

    const docRef = await db.collection('documents').add({
      phone,
      title,
      filePath,
      category,
      fiscalYear: fiscalYear ?? null,
      subCategory: subCategory ?? null,
      uploadedAt: new Date().toISOString()
    })

    return NextResponse.json({
      id: docRef.id,
      phone,
      title,
      filePath,
      category,
      fiscalYear: fiscalYear ?? null,
      subCategory: subCategory ?? null,
      uploadedAt: new Date().toISOString()
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    )
  }
}
