import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebase-admin'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  const auth = await verifyAdminToken(req)
  if (!auth.authorized) return unauthorizedResponse(auth.error)

  try {
    const db = getFirestore()
    const doc = await db.collection('config').doc('categories').get()

    if (!doc.exists) {
      return NextResponse.json({ categories: {} })
    }

    return NextResponse.json({ categories: doc.data()?.categories || {} })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyAdminToken(req)
  if (!auth.authorized) return unauthorizedResponse(auth.error)

  try {
    const { categories } = await req.json()

    const db = getFirestore()
    await db.collection('config').doc('categories').set({
      categories,
      updatedAt: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving categories:', error)
    return NextResponse.json({ error: 'Failed to save categories' }, { status: 500 })
  }
}
