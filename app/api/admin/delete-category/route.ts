import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from '@/lib/firebase-admin'
import { verifyAdminToken, unauthorizedResponse } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  const auth = await verifyAdminToken(request)
  if (!auth.authorized) {
    return unauthorizedResponse(auth.error)
  }

  try {
    const body = await request.json()
    const { type, category, fiscalYear, subCategory } = body

    if (!type || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = getFirestore()

    // Update the categories configuration
    const categoriesRef = db.collection('config').doc('categories')
    const categoriesDoc = await categoriesRef.get()

    if (!categoriesDoc.exists) {
      return NextResponse.json({ error: 'Categories configuration not found' }, { status: 404 })
    }

    const categoriesData = categoriesDoc.data()
    const categories = categoriesData?.categories || {}

    if (type === 'category') {
      // Delete the entire category
      if (categories[category]) {
        delete categories[category]
      }
    } else if (type === 'fiscalYear' && fiscalYear) {
      // Remove fiscal year from the category config
      if (categories[category]?.fiscalYears) {
        categories[category].fiscalYears = categories[category].fiscalYears.filter(
          (fy: string) => fy !== fiscalYear
        )
      }
    } else if (type === 'subCategory' && subCategory) {
      // Remove subcategory from the category config
      if (categories[category]?.subCategories) {
        categories[category].subCategories = categories[category].subCategories.filter(
          (sc: string) => sc !== subCategory
        )
      }
    }

    await categoriesRef.update({ categories })

    return NextResponse.json({
      success: true,
      message: `Deleted ${type} successfully`
    })
  } catch (error) {
    console.error('Error deleting:', error)
    return NextResponse.json(
      { error: 'Failed to delete' },
      { status: 500 }
    )
  }
}
