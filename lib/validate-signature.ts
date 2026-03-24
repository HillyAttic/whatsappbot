import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Validates the X-Hub-Signature-256 header from WhatsApp webhook requests.
 * Uses HMAC-SHA256 and constant-time comparison to prevent timing attacks.
 * 
 * @param body - The raw request body as a string
 * @param signature - The value of the X-Hub-Signature-256 header
 * @param secret - The APP_SECRET environment variable
 * @returns true if the signature is valid, false otherwise
 */
export function validateSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  if (!signature || !signature.startsWith('sha256=')) {
    return false
  }

  const expectedSignature = createHmac('sha256', secret)
    .update(body)
    .digest('hex')

  const providedSignature = signature.slice(7) // Remove 'sha256=' prefix

  if (expectedSignature.length !== providedSignature.length) {
    return false
  }

  return timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(providedSignature)
  )
}
