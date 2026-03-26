import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from './simple-auth'

export async function verifyAdminToken(request: NextRequest): Promise<{ 
  authorized: boolean
  userId?: string
  error?: string 
}> {
  try {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { authorized: false, error: 'No authorization token provided' }
    }

    const token = authHeader.split('Bearer ')[1]
    
    // Verify the token
    const user = verifyToken(token)
    
    if (!user || !user.isAdmin) {
      return { authorized: false, error: 'User is not an admin' }
    }

    return { authorized: true, userId: user.email }
  } catch (error) {
    console.error('Token verification error:', error)
    return { authorized: false, error: 'Invalid or expired token' }
  }
}

export function unauthorizedResponse(message: string = 'Unauthorized') {
  return NextResponse.json(
    { error: message },
    { status: 401 }
  )
}
