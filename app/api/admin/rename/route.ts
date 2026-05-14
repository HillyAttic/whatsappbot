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
    const { type, category, fiscalYear, subCategory, newName } = body

    if (!type || !category || !newName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const db = getFirestore()

    // Get all clients to update their documents
    const clientsSnapshot = await db.collection('users').get()
    const batch = db.batch()
    let updateCount = 0

    for (const clientDoc of clientsSnapshot.docs) {
      const clientId = clientDoc.id
      const documentsRef = db.collection('users').doc(clientId).collection('documents')

      let query: FirebaseFirestore.Query = documentsRef.where('category', '==', category)

      if (type === 'fiscalYear' && fiscalYear) {
        query = query.where('fiscalYear', '==', fiscalYear)
      } else if (type === 'subCategory' && fiscalYear && subCategory) {
        query = query.where('fiscalYear', '==', fiscalYear).where('subCategory', '==', subCategory)
      }

      const docsSnapshot = await query.get()

      for (const doc of docsSnapshot.docs) {
        const data = doc.data()
        const updateData: any = {}

        if (type === 'category') {
          updateData.category = newName
          // Update filePath to reflect new category name
          if (data.filePath) {
            const pathParts = data.filePath.split('/')
            const categoryIndex = pathParts.findIndex((part: string) => part === category)
            if (categoryIndex !== -1) {
              pathParts[categoryIndex] = newName
              updateData.filePath = pathParts.join('/')
            }
          }
        } else if (type === 'fiscalYear') {
          updateData.fiscalYear = newName
          // Update filePath to reflect new fiscal year name
          if (data.filePath) {
            const pathParts = data.filePath.split('/')
            const fyIndex = pathParts.findIndex((part: string) => part === fiscalYear)
            if (fyIndex !== -1) {
              pathParts[fyIndex] = newName
              updateData.filePath = pathParts.join('/')
            }
          }
        } else if (type === 'subCategory') {
          updateData.subCategory = newName
          // Update filePath to reflect new subcategory name
          if (data.filePath) {
            const pathParts = data.filePath.split('/')
            const scIndex = pathParts.findIndex((part: string) => part === subCategory)
            if (scIndex !== -1) {
              pathParts[scIndex] = newName
              updateData.filePath = pathParts.join('/')
            }
          }
        }

        batch.update(doc.ref, updateData)
        updateCount++
      }
    }

    // Update the categories configuration
    const categoriesRef = db.collection('config').doc('categories')
    const categoriesDoc = await categoriesRef.get()

    if (categoriesDoc.exists) {
      const categoriesData = categoriesDoc.data()
      const categories = categoriesData?.categories || {}

      if (type === 'category') {
        // Rename the category key
        if (categories[category]) {
          categories[newName] = categories[category]
          delete categories[category]
        }
      } else if (type === 'fiscalYear' && fiscalYear) {
        // Update fiscal year in the category config
        if (categories[category]?.fiscalYears) {
          const fyIndex = categories[category].fiscalYears.indexOf(fiscalYear)
          if (fyIndex !== -1) {
            categories[category].fiscalYears[fyIndex] = newName
          }
        }
      } else if (type === 'subCategory' && subCategory) {
        // Update subcategory in the category config
        if (categories[category]?.subCategories) {
          const scIndex = categories[category].subCategories.indexOf(subCategory)
          if (scIndex !== -1) {
            categories[category].subCategories[scIndex] = newName
          }
        }
      }

      batch.update(categoriesRef, { categories })
    }

    await batch.commit()

    return NextResponse.json({
      success: true,
      message: `Renamed ${type} successfully`,
      documentsUpdated: updateCount
    })
  } catch (error) {
    console.error('Error renaming:', error)
    return NextResponse.json(
      { error: 'Failed to rename' },
      { status: 500 }
    )
  }
}
