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
    console.error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is missing')
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON environment variable is required')
  }

  let serviceAccount
  try {
    serviceAccount = JSON.parse(serviceAccountJson)
    console.log('Firebase service account parsed successfully, project:', serviceAccount.project_id)
  } catch (error) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', error)
    console.error('First 100 chars:', serviceAccountJson.substring(0, 100))
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON')
  }

  // Fix private_key: Netlify env vars often store \n as literal \\n strings
  // The private key MUST contain actual newline characters for the crypto to work
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n')
    console.log('Firebase private_key processed, length:', serviceAccount.private_key.length)
  } else {
    console.error('Firebase service account is missing private_key field')
    throw new Error('Firebase service account JSON is missing the private_key field')
  }

  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: `${serviceAccount.project_id}.firebasestorage.app`
    })
    console.log('Firebase Admin SDK initialized successfully')
  } catch (initError) {
    console.error('Firebase Admin SDK initialization failed:', initError)
    throw initError
  }

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
