import { createHmac, timingSafeEqual } from 'crypto'

export interface AuthUser {
  email: string
  isAdmin: boolean
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET environment variable is required')
  return secret
}

export function validateCredentials(email: string, password: string): AuthUser | null {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  if (!adminEmail || !adminPassword) return null
  if (email === adminEmail && password === adminPassword) {
    return { email, isAdmin: true }
  }
  return null
}

export function generateToken(user: AuthUser): string {
  const payload = Buffer.from(JSON.stringify(user)).toString('base64url')
  const sig = createHmac('sha256', getSecret()).update(payload).digest('base64url')
  return `${payload}.${sig}`
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const dotIndex = token.lastIndexOf('.')
    if (dotIndex === -1) return null
    const payload = token.slice(0, dotIndex)
    const sig = token.slice(dotIndex + 1)
    const expectedSig = createHmac('sha256', getSecret()).update(payload).digest('base64url')
    const sigBuf = Buffer.from(sig)
    const expectedBuf = Buffer.from(expectedSig)
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return null
    const user = JSON.parse(Buffer.from(payload, 'base64url').toString()) as AuthUser
    if (user.email === process.env.ADMIN_EMAIL && user.isAdmin) return user
    return null
  } catch {
    return null
  }
}
