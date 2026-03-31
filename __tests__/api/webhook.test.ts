import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { GET, POST } from '@/app/api/webhook/route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/document-service', () => ({
  parseWebhookPayload: vi.fn(),
  sanitizeMessageBody: vi.fn((text: string) => text),
  findUser: vi.fn(),
  getBotSession: vi.fn(),
  saveBotSession: vi.fn(),
}))

vi.mock('@/lib/phone', () => ({
  normalizePhone: vi.fn((phone: string) => phone.replace(/\D/g, '')),
}))

vi.mock('@/lib/message-sender', () => ({
  sendMessage: vi.fn(),
}))

vi.mock('@/lib/bot-flow', () => ({
  processMessage: vi.fn(),
}))

vi.mock('@/lib/validate-signature', () => ({
  validateSignature: vi.fn(),
}))

import {
  parseWebhookPayload,
  findUser,
  getBotSession,
  saveBotSession,
} from '@/lib/document-service'
import { sendMessage } from '@/lib/message-sender'
import { processMessage } from '@/lib/bot-flow'
import { validateSignature } from '@/lib/validate-signature'

describe('webhook API route', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    process.env.WEBHOOK_VERIFY_TOKEN = 'test-verify-token'
    process.env.APP_SECRET = 'test-app-secret'
    vi.clearAllMocks()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('GET - Webhook Verification', () => {
    it('returns challenge for valid verification request', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string().filter(s => s.length > 0),
          async (challenge) => {
            const url = `http://localhost:3000/api/webhook?hub.mode=subscribe&hub.verify_token=test-verify-token&hub.challenge=${encodeURIComponent(challenge)}`
            const req = new NextRequest(url)

            const response = await GET(req)
            const text = await response.text()

            expect(response.status).toBe(200)
            expect(text).toBe(challenge)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return 403 when verify_token does not match', async () => {
      const url = 'http://localhost:3000/api/webhook?hub.mode=subscribe&hub.verify_token=wrong-token&hub.challenge=test'
      const req = new NextRequest(url)

      const response = await GET(req)
      expect(response.status).toBe(403)
    })

    it('should return 403 when hub.mode is not subscribe', async () => {
      const url = 'http://localhost:3000/api/webhook?hub.mode=unsubscribe&hub.verify_token=test-verify-token&hub.challenge=test'
      const req = new NextRequest(url)

      const response = await GET(req)
      expect(response.status).toBe(403)
    })

    it('should return 403 when challenge is missing', async () => {
      const url = 'http://localhost:3000/api/webhook?hub.mode=subscribe&hub.verify_token=test-verify-token'
      const req = new NextRequest(url)

      const response = await GET(req)
      expect(response.status).toBe(403)
    })

    it('should return 500 when WEBHOOK_VERIFY_TOKEN is missing', async () => {
      delete process.env.WEBHOOK_VERIFY_TOKEN

      const url = 'http://localhost:3000/api/webhook?hub.mode=subscribe&hub.verify_token=test&hub.challenge=test'
      const req = new NextRequest(url)

      const response = await GET(req)
      expect(response.status).toBe(500)
    })
  })

  describe('POST - Message Handling', () => {
    it('returns 200 for valid webhook POST with signature', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            from: fc.string(),
            text: fc.string(),
          }),
          async ({ from, text }) => {
            vi.mocked(validateSignature).mockReturnValue(true)
            vi.mocked(parseWebhookPayload).mockReturnValue({ from, text })
            vi.mocked(findUser).mockResolvedValue(null)

            const req = new NextRequest('http://localhost:3000/api/webhook', {
              method: 'POST',
              headers: {
                'x-hub-signature-256': 'sha256=test',
                'content-type': 'application/json',
              },
              body: JSON.stringify({}),
            })

            const response = await POST(req)
            expect(response.status).toBe(200)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return 401 when signature header is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/webhook', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const response = await POST(req)
      expect(response.status).toBe(401)
    })

    it('should return 401 when signature is invalid', async () => {
      vi.mocked(validateSignature).mockReturnValue(false)

      const req = new NextRequest('http://localhost:3000/api/webhook', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': 'sha256=invalid',
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const response = await POST(req)
      expect(response.status).toBe(401)
    })

    it('should return 200 when messages array is missing', async () => {
      vi.mocked(validateSignature).mockReturnValue(true)
      vi.mocked(parseWebhookPayload).mockReturnValue(null)

      const req = new NextRequest('http://localhost:3000/api/webhook', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': 'sha256=test',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ entry: [] }),
      })

      const response = await POST(req)
      expect(response.status).toBe(200)
    })

    it('sends not-found message for unregistered user', async () => {
      vi.mocked(validateSignature).mockReturnValue(true)
      vi.mocked(parseWebhookPayload).mockReturnValue({ from: '123', text: 'hi' })
      vi.mocked(findUser).mockResolvedValue(null)

      const req = new NextRequest('http://localhost:3000/api/webhook', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': 'sha256=test',
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      await POST(req)

      expect(sendMessage).toHaveBeenCalledWith('123', expect.stringContaining('could not find your account'))
    })

    it('delegates to processMessage for registered users', async () => {
      vi.mocked(validateSignature).mockReturnValue(true)
      vi.mocked(parseWebhookPayload).mockReturnValue({ from: '123', text: 'hi' })
      vi.mocked(findUser).mockResolvedValue({ name: 'Test', phone: '123' })
      vi.mocked(getBotSession).mockResolvedValue(null)
      vi.mocked(processMessage).mockResolvedValue({
        message: 'Welcome menu',
        session: {
          currentStep: 'category_selection',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 1800000).toISOString(),
        },
      })

      const req = new NextRequest('http://localhost:3000/api/webhook', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': 'sha256=test',
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      await POST(req)

      expect(processMessage).toHaveBeenCalledWith('123', 'hi', null)
      expect(saveBotSession).toHaveBeenCalled()
      expect(sendMessage).toHaveBeenCalledWith('123', 'Welcome menu')
    })

    it('passes existing session to processMessage', async () => {
      const existingSession = {
        currentStep: 'category_selection',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1800000).toISOString(),
      }

      vi.mocked(validateSignature).mockReturnValue(true)
      vi.mocked(parseWebhookPayload).mockReturnValue({ from: '123', text: '1' })
      vi.mocked(findUser).mockResolvedValue({ name: 'Test', phone: '123' })
      vi.mocked(getBotSession).mockResolvedValue(existingSession)
      vi.mocked(processMessage).mockResolvedValue({
        message: 'Year selection menu',
        session: {
          ...existingSession,
          currentStep: 'audit_year',
          category: 'Audit Report',
        },
      })

      const req = new NextRequest('http://localhost:3000/api/webhook', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': 'sha256=test',
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      await POST(req)

      expect(processMessage).toHaveBeenCalledWith('123', '1', existingSession)
    })

    it('does not save session when processMessage returns null session', async () => {
      vi.mocked(validateSignature).mockReturnValue(true)
      vi.mocked(parseWebhookPayload).mockReturnValue({ from: '123', text: 'random' })
      vi.mocked(findUser).mockResolvedValue({ name: 'Test', phone: '123' })
      vi.mocked(getBotSession).mockResolvedValue(null)
      vi.mocked(processMessage).mockResolvedValue({
        message: "Please send 'Hi' to start.",
        session: null,
      })

      const req = new NextRequest('http://localhost:3000/api/webhook', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': 'sha256=test',
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      await POST(req)

      expect(saveBotSession).not.toHaveBeenCalled()
      expect(sendMessage).toHaveBeenCalledWith('123', "Please send 'Hi' to start.")
    })
  })
})
