'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function HomePage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, user, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && isAdmin) {
      router.push('/admin')
    }
  }, [user, isAdmin, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
    } catch (err: any) {
      let errorMessage = 'Failed to sign in'

      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password'
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = 'No user found with this email'
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address'
      } else if (err.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled'
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later'
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">
      {/* Geometric decorative elements */}
      <div className="fixed top-0 left-0 w-64 h-64 bg-accent/5 -translate-x-1/2 -translate-y-1/2 rotate-45 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-teal/5 translate-x-1/3 translate-y-1/3 rotate-12 pointer-events-none" />
      <div className="fixed top-1/4 right-8 w-2 h-32 bg-accent/20 rotate-45 pointer-events-none hidden lg:block" />
      <div className="fixed bottom-1/4 left-8 w-2 h-24 bg-teal/20 -rotate-12 pointer-events-none hidden lg:block" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo + Title block — asymmetric, bold */}
        <div className="mb-10 animate-slide-up">
          <div className="flex items-start gap-4 mb-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-none bg-ink flex items-center justify-center shadow-bold">
                <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              {/* Accent corner */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-accent" />
            </div>
            <div className="pt-2">
              <span className="eyebrow block mb-1">Admin Portal</span>
              <h1 className="text-4xl font-display font-bold text-ink tracking-tight leading-none">JPCO<span className="text-accent">.</span></h1>
            </div>
          </div>
          <div className="accent-line pl-3">
            <p className="text-sm text-ink-secondary font-medium">WhatsApp Document Retrieval System</p>
            <p className="text-xs text-ink-muted mt-0.5">Sign in to your admin account to continue</p>
          </div>
        </div>

        {/* Login form — sharp corners, bold borders */}
        <div className="bg-white border-2 border-ink/10 shadow-bold p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
          {error && (
            <div className="mb-4 p-3 bg-danger-light border-l-4 border-danger flex items-center gap-2">
              <svg className="w-4 h-4 text-danger flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <span className="text-sm text-danger font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="eyebrow block mb-2">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@jpco.com"
                className="w-full px-4 py-3 bg-surface border-2 border-ink/10 rounded-none text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent focus:ring-0 transition-all font-mono"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="eyebrow block mb-2">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-surface border-2 border-ink/10 rounded-none text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-accent focus:ring-0 transition-all font-mono"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-accent text-white text-sm font-bold uppercase tracking-wider rounded-none hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-bold hover:shadow-glow-accent"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-ink-muted mt-6 animate-fade-in">
          JPCO &copy; {new Date().getFullYear()} — WhatsApp Bot v2.0
        </p>
      </div>
    </div>
  )
}
