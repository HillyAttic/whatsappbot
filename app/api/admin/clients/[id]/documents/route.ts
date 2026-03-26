import { NextRequest, NextResponse } from 'next/server'
import { clientStorage, documentStorage, fileStorage } from '@/lib/simple-storage'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth-middleware'

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
    const client = await clientStorage.getById(params.id)
    
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const phone = client.phone
    const documents = await documentStorage.getByPhone(phone)

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
    const client = await clientStorage.getById(params.id)
    
    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const phone = client.phone

    // Parse multipart form data
    const formData = await req.formData()
    const title = formData.get('title') as string
    const file = formData.get('file') as File

    if (!title || !file) {
      return NextResponse.json(
        { error: 'Title and file are required' },
        { status: 400 }
      )
    }

    // Upload file to storage
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const filePath = await fileStorage.upload(phone, fileBuffer, file.name)

    // Create document
    const document = await documentStorage.create({
      phone,
      title,
      filePath,
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error('Error creating document:', error)
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    )
  }
}
