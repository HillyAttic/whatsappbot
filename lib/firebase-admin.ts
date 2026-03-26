import * as admin from 'firebase-admin'

if (!admin.apps.length) {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON

  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set')
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson)

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    })
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error)
    throw error
  }
}

export const getFirestore = () => admin.firestore()
export const getStorage = () => admin.storage()
export const auth = admin.auth()

export default admin
