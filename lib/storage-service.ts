import { getStorage } from './firebase-admin'

/**
 * Generates a signed URL for a file in Firebase Storage with 5-minute expiration.
 * @param filePath - The Firebase Storage path (e.g., "users/15551234567/documents/invoice.pdf")
 * @returns A signed URL that expires in 5 minutes
 */
export async function generateSignedUrl(filePath: string): Promise<string> {
  const bucket = getStorage().bucket()
  const file = bucket.file(filePath)

  const expirationTime = Date.now() + 5 * 60 * 1000 // 5 minutes

  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: expirationTime,
  })

  return url
}

/**
 * Uploads a file to Firebase Storage.
 * @param phone - The normalized phone number
 * @param fileBuffer - The file content as a Buffer
 * @param filename - The original filename
 * @returns The Firebase Storage path where the file was stored
 */
export async function uploadFile(
  phone: string,
  fileBuffer: Buffer,
  filename: string
): Promise<string> {
  const filePath = `users/${phone}/documents/${filename}`
  const bucket = getStorage().bucket()
  const file = bucket.file(filePath)

  await file.save(fileBuffer, {
    metadata: {
      contentType: 'application/octet-stream',
    },
  })

  return filePath
}

/**
 * Deletes a file from Firebase Storage.
 * @param filePath - The Firebase Storage path to delete
 */
export async function deleteFile(filePath: string): Promise<void> {
  const bucket = getStorage().bucket()
  const file = bucket.file(filePath)

  await file.delete()
}
