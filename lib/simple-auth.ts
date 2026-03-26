// Simple authentication without Firebase
// Admin credentials (in production, use environment variables and hashed passwords)
export const ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'Admin123!',
}

export interface AuthUser {
  email: string
  isAdmin: boolean
}

export function validateCredentials(email: string, password: string): AuthUser | null {
  if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
    return {
      email: ADMIN_CREDENTIALS.email,
      isAdmin: true,
    }
  }
  return null
}

export function generateToken(user: AuthUser): string {
  // Simple token generation (in production, use JWT with proper signing)
  return Buffer.from(JSON.stringify(user)).toString('base64')
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8')
    const user = JSON.parse(decoded) as AuthUser
    if (user.email === ADMIN_CREDENTIALS.email && user.isAdmin) {
      return user
    }
    return null
  } catch {
    return null
  }
}
