'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface AuthUser {
  email: string
  isAdmin: boolean
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
  getToken: () => string | null
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  signIn: async () => {},
  signOut: () => {},
  getToken: () => null
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Check for existing token in localStorage
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      verifyStoredToken(storedToken)
    } else {
      setLoading(false)
    }
  }, [])

  const verifyStoredToken = async (storedToken: string) => {
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: storedToken })
      })

      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
        setToken(storedToken)
        // Keep cookie in sync with localStorage
        document.cookie = `auth_token=${storedToken}; path=/; SameSite=Strict`
      } else {
        localStorage.removeItem('auth_token')
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict'
      }
    } catch (error) {
      console.error('Token verification failed:', error)
      localStorage.removeItem('auth_token')
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict'
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })

    if (!res.ok) {
      const error = await res.json()
      throw new Error(error.error || 'Login failed')
    }

    const data = await res.json()
    setUser(data.user)
    setToken(data.token)
    localStorage.setItem('auth_token', data.token)
    // Set cookie so middleware can verify the session server-side
    document.cookie = `auth_token=${data.token}; path=/; SameSite=Strict`
  }

  const signOut = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
    // Clear the auth cookie
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict'
  }

  const getToken = () => token

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isAdmin: user?.isAdmin || false, 
      signIn, 
      signOut,
      getToken
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
