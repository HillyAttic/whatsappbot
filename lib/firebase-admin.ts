import admin from 'firebase-admin'

let firebaseApp: admin.app.App | undefined | null

/**
 * Initializes and returns a singleton Firebase Admin SDK instance.
 * Uses the FIREBASE_SERVICE_ACCOUNT_JSON environment variable for credentials.
 */
function initializeFirebase(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp
  }

  // Check if already initialized
  if (admin.apps.length > 0) {
    firebaseApp = admin.apps[0] as admin.app.App
    return firebaseApp
  }

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is required')
  }

  let serviceAccount
  try {
    serviceAccount = JSON.parse(serviceAccountJson)
  } catch (error) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON')
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: `${serviceAccount.project_id}.firebasestorage.app`
  })

  return firebaseApp
}

/**
 * Returns the Firestore client instance.
 */
export function getFirestore(): admin.firestore.Firestore {
  const app = initializeFirebase()
  return app.firestore()
}

/**
 * Returns the Firebase Storage bucket instance.
 */
export function getStorage(): admin.storage.Storage {
  const app = initializeFirebase()
  return app.storage()
}
