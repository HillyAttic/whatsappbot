export interface AuthUser {
  email: string
  isAdmin: boolean
}

// Edge-compatible token verification (uses Web Crypto API)
export async function verifyTokenEdge(token: string): Promise<AuthUser | null> {
  try {
    const dotIndex = token.lastIndexOf('.')
    if (dotIndex === -1) return null
    
    const payload = token.slice(0, dotIndex)
    const sig = token.slice(dotIndex + 1)
    
    const secret = process.env.JWT_SECRET
    if (!secret) return null
    
    // Use Web Crypto API for Edge Runtime
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
    const expectedSig = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
    
    if (sig !== expectedSig) return null
    
    const userJson = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    const user = JSON.parse(userJson) as AuthUser
    
    if (user.email === process.env.ADMIN_EMAIL && user.isAdmin) return user
    return null
  } catch {
    return null
  }
}
