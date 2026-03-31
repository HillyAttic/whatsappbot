import * as admin from 'firebase-admin'

let isInitialized = false
let initError: Error | null = null

function initializeFirebase() {
  if (isInitialized) return
  if (initError) throw initError

  if (admin.apps.length) {
    isInitialized = true
    return
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON

  if (!serviceAccountJson) {
    initError = new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is not set')
    throw initError
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountJson.replace(/\n/g, '\\n'))

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    })
    
    isInitialized = true
    console.log('Firebase Admin initialized successfully')
  } catch (error) {
    initError = error instanceof Error ? error : new Error(String(error))
    console.error('Failed to initialize Firebase Admin:', initError)
    throw initError
  }
}

export const getFirestore = () => {
  try {
    initializeFirebase()
    return admin.firestore()
  } catch (error) {
    console.error('Error getting Firestore:', error)
    throw error
  }
}

export const getStorage = () => {
  try {
    initializeFirebase()
    return admin.storage()
  } catch (error) {
    console.error('Error getting Storage:', error)
    throw error
  }
}

export const getAuth = () => {
  try {
    initializeFirebase()
    return admin.auth()
  } catch (error) {
    console.error('Error getting Auth:', error)
    throw error
  }
}

export default admin
