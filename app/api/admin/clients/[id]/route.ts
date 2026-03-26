import { NextRequest, NextResponse } from 'next/server'
import { clientStorage, documentStorage, fileStorage } from '@/lib/simple-storage'
import { normalizePhone } from '@/lib/phone'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth-middleware'

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
    const body = await req.json()
    const { name, phone } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and phone are required' },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizePhone(phone)
    const client = await clientStorage.update(params.id, {
      name,
      phone: normalizedPhone,
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(client)
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
    const client = await clientStorage.getById(params.id)

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      )
    }

    const phone = client.phone

    // Get all documents for this client
    const docs = await documentStorage.getByPhone(phone)

    // Delete files from storage
    for (const doc of docs) {
      if (doc.filePath) {
        try {
          await fileStorage.delete(doc.filePath)
        } catch (error) {
          console.error(`Error deleting file ${doc.filePath}:`, error)
        }
      }
    }

    // Delete all documents
    await documentStorage.deleteByPhone(phone)

    // Delete client
    await clientStorage.delete(params.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    )
  }
}
