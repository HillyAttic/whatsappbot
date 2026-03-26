import { getStorage } from './firebase-admin'

/**
 * Generate a signed URL for a file in Firebase Storage
 */
export async function generateSignedUrl(filePath: string): Promise<string> {
  const bucket = getStorage().bucket()
  const file = bucket.file(filePath)

  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
  })

  return url
}

/**
 * Upload a file to Firebase Storage
 */
export async function uploadFile(
  buffer: Buffer,
  destination: string,
  contentType?: string
): Promise<string> {
  const bucket = getStorage().bucket()
  const file = bucket.file(destination)

  await file.save(buffer, {
    contentType: contentType || 'application/octet-stream',
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  })

  return destination
}

/**
 * Delete a file from Firebase Storage
 */
export async function deleteFile(filePath: string): Promise<void> {
  const bucket = getStorage().bucket()
  const file = bucket.file(filePath)

  await file.delete()
}
