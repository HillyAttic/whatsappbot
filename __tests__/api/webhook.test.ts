import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { createHmac } from 'crypto'
import { GET, POST } from '@/app/api/webhook/route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/document-service', () => ({
  parseWebhookPayload: vi.fn(),
  sanitizeMessageBody: vi.fn((text: string) => text),
  findUser: vi.fn(),
  getDocuments: vi.fn(),
  storeSession: vi.fn(),
  getSession: vi.fn(),
}))

vi.mock('@/lib/phone', () => ({
  normalizePhone: vi.fn((phone: string) => phone.replace(/\D/g, '')),
}))

vi.mock('@/lib/message-sender', () => ({
  sendMessage: vi.fn(),
}))

vi.mock('@/lib/storage-service', () => ({
  generateSignedUrl: vi.fn(),
}))

vi.mock('@/lib/validate-signature', () => ({
  validateSignature: vi.fn(),
}))

import {
  parseWebhookPayload,
  findUser,
  getDocuments,
  storeSession,
  getSession,
} from '@/lib/document-service'
import { sendMessage } from '@/lib/message-sender'
import { generateSignedUrl } from '@/lib/storage-service'
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
    // Feature: whatsapp-document-retrieval-bot, Property 1: Webhook verification challenge round-trip
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
    // Feature: whatsapp-document-retrieval-bot, Property 2: Valid POST returns 200
    it('returns 200 for valid webhook POST with signature', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            from: fc.string(),
            text: fc.string(),
          }),
          async ({ from, text }) => {
            const payload = {
              entry: [
                {
                  changes: [
                    {
                      value: {
                        messages: [
                          {
                            from,
                            text: { body: text },
                          },
                        ],
                      },
                    },
                  ],
                },
              ],
            }

            const body = JSON.stringify(payload)
            const signature = 'sha256=' + createHmac('sha256', 'test-app-secret')
              .update(body)
              .digest('hex')

            vi.mocked(validateSignature).mockReturnValue(true)
            vi.mocked(parseWebhookPayload).mockReturnValue({ from, text })
            vi.mocked(findUser).mockResolvedValue(null)

            const req = new NextRequest('http://localhost:3000/api/webhook', {
              method: 'POST',
              headers: {
                'x-hub-signature-256': signature,
                'content-type': 'application/json',
              },
              body,
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

    // Feature: whatsapp-document-retrieval-bot, Property 6: Greeting reply format
    it('sends numbered list with instruction for "hi" message', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string(),
          fc.array(
            fc.record({
              id: fc.string(),
              phone: fc.string(),
              title: fc.string(),
              filePath: fc.string(),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (from, documents) => {
            vi.clearAllMocks()
            vi.mocked(validateSignature).mockReturnValue(true)
            vi.mocked(parseWebhookPayload).mockReturnValue({ from, text: 'hi' })
            vi.mocked(findUser).mockResolvedValue({ id: '1', name: 'Test', phone: from })
            vi.mocked(getDocuments).mockResolvedValue(documents)

            const req = new NextRequest('http://localhost:3000/api/webhook', {
              method: 'POST',
              headers: {
                'x-hub-signature-256': 'sha256=test',
                'content-type': 'application/json',
              },
              body: JSON.stringify({}),
            })

            await POST(req)

            expect(sendMessage).toHaveBeenCalled()
            const sentMessage = vi.mocked(sendMessage).mock.lastCall![1]
            
            // Should contain numbered lines for each document
            documents.forEach((doc, index) => {
              expect(sentMessage).toContain(`${index + 1}. ${doc.title}`)
            })
            
            // Should contain instruction line
            expect(sentMessage).toContain('Reply with a number to get the document link.')
          }
        ),
        { numRuns: 100 }
      )
    })

    // Feature: whatsapp-document-retrieval-bot, Property 7: Document list cap
    it('caps document list at 5 items', async () => {
      const documents = Array.from({ length: 10 }, (_, i) => ({
        id: `${i}`,
        phone: '123',
        title: `Doc ${i}`,
        filePath: `path/${i}`,
      }))

      vi.mocked(validateSignature).mockReturnValue(true)
      vi.mocked(parseWebhookPayload).mockReturnValue({ from: '123', text: 'hi' })
      vi.mocked(findUser).mockResolvedValue({ id: '1', name: 'Test', phone: '123' })
      vi.mocked(getDocuments).mockResolvedValue(documents.slice(0, 5))

      const req = new NextRequest('http://localhost:3000/api/webhook', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': 'sha256=test',
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      await POST(req)

      expect(storeSession).toHaveBeenCalledWith('123', documents.slice(0, 5))
    })

    // Feature: whatsapp-document-retrieval-bot, Property 9: Number selection generates signed URL
    it('generates signed URL for valid number selection', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string(),
          fc.integer({ min: 1, max: 5 }),
          fc.array(
            fc.record({
              id: fc.string(),
              phone: fc.string(),
              title: fc.string(),
              filePath: fc.string(),
            }),
            { minLength: 5, maxLength: 5 }
          ),
          async (from, selectedNumber, documents) => {
            vi.mocked(validateSignature).mockReturnValue(true)
            vi.mocked(parseWebhookPayload).mockReturnValue({ from, text: selectedNumber.toString() })
            vi.mocked(findUser).mockResolvedValue({ id: '1', name: 'Test', phone: from })
            vi.mocked(getSession).mockReturnValue(documents)
            vi.mocked(generateSignedUrl).mockResolvedValue('https://signed-url.com/doc')

            const req = new NextRequest('http://localhost:3000/api/webhook', {
              method: 'POST',
              headers: {
                'x-hub-signature-256': 'sha256=test',
                'content-type': 'application/json',
              },
              body: JSON.stringify({}),
            })

            await POST(req)

            expect(generateSignedUrl).toHaveBeenCalledWith(documents[selectedNumber - 1].filePath)
            expect(sendMessage).toHaveBeenCalledWith(from, 'https://signed-url.com/doc')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('sends error message for unregistered user', async () => {
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

      expect(sendMessage).toHaveBeenCalledWith('123', 'You are not registered')
    })

    it('sends message for empty document list', async () => {
      vi.mocked(validateSignature).mockReturnValue(true)
      vi.mocked(parseWebhookPayload).mockReturnValue({ from: '123', text: 'hi' })
      vi.mocked(findUser).mockResolvedValue({ id: '1', name: 'Test', phone: '123' })
      vi.mocked(getDocuments).mockResolvedValue([])

      const req = new NextRequest('http://localhost:3000/api/webhook', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': 'sha256=test',
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      await POST(req)

      expect(sendMessage).toHaveBeenCalledWith('123', 'You have no documents available.')
    })

    it('sends error for out-of-range selection', async () => {
      const documents = [
        { id: '1', phone: '123', title: 'Doc 1', filePath: 'path/1' },
      ]

      vi.mocked(validateSignature).mockReturnValue(true)
      vi.mocked(parseWebhookPayload).mockReturnValue({ from: '123', text: '5' })
      vi.mocked(findUser).mockResolvedValue({ id: '1', name: 'Test', phone: '123' })
      vi.mocked(getSession).mockReturnValue(documents)

      const req = new NextRequest('http://localhost:3000/api/webhook', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': 'sha256=test',
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      await POST(req)

      expect(sendMessage).toHaveBeenCalledWith('123', 'Invalid selection. Please reply with a number from the list.')
    })

    it('sends error when no active session exists', async () => {
      vi.mocked(validateSignature).mockReturnValue(true)
      vi.mocked(parseWebhookPayload).mockReturnValue({ from: '123', text: '1' })
      vi.mocked(findUser).mockResolvedValue({ id: '1', name: 'Test', phone: '123' })
      vi.mocked(getSession).mockReturnValue(undefined)

      const req = new NextRequest('http://localhost:3000/api/webhook', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': 'sha256=test',
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      await POST(req)

      expect(sendMessage).toHaveBeenCalledWith('123', "Please send 'Hi' to start.")
    })

    it('handles signed URL generation failure', async () => {
      const documents = [
        { id: '1', phone: '123', title: 'Doc 1', filePath: 'path/1' },
      ]

      vi.mocked(validateSignature).mockReturnValue(true)
      vi.mocked(parseWebhookPayload).mockReturnValue({ from: '123', text: '1' })
      vi.mocked(findUser).mockResolvedValue({ id: '1', name: 'Test', phone: '123' })
      vi.mocked(getSession).mockReturnValue(documents)
      vi.mocked(generateSignedUrl).mockRejectedValue(new Error('Storage error'))

      const req = new NextRequest('http://localhost:3000/api/webhook', {
        method: 'POST',
        headers: {
          'x-hub-signature-256': 'sha256=test',
          'content-type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      await POST(req)

      expect(sendMessage).toHaveBeenCalledWith('123', 'Unable to retrieve document. Please try again later.')
    })
  })
})
