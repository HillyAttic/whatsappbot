import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sendMessage } from '@/lib/message-sender'

describe('message-sender.ts', () => {
  const originalEnv = process.env

  beforeEach(() => {
    vi.resetModules()
    process.env = { ...originalEnv }
    process.env.WHATSAPP_TOKEN = 'test-token'
    process.env.PHONE_NUMBER_ID = 'test-phone-id'
    global.fetch = vi.fn()
  })

  afterEach(() => {
    process.env = originalEnv
    vi.restoreAllMocks()
  })

  describe('Unit Tests - Edge Cases', () => {
    it('should throw error when WHATSAPP_TOKEN is missing', async () => {
      delete process.env.WHATSAPP_TOKEN

      await expect(sendMessage('1234567890', 'test')).rejects.toThrow(
        'WHATSAPP_TOKEN environment variable is required'
      )
    })

    it('should throw error when PHONE_NUMBER_ID is missing', async () => {
      delete process.env.PHONE_NUMBER_ID

      await expect(sendMessage('1234567890', 'test')).rejects.toThrow(
        'PHONE_NUMBER_ID environment variable is required'
      )
    })

    it('should send message with correct parameters', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      })
      global.fetch = mockFetch

      await sendMessage('1234567890', 'Hello, World!')

      expect(mockFetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v18.0/test-phone-id/messages',
        {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: '1234567890',
            type: 'text',
            text: {
              body: 'Hello, World!',
            },
          }),
        }
      )
    })

    it('should throw error when WhatsApp API returns non-2xx status', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        text: async () => 'Bad Request',
      })
      global.fetch = mockFetch

      await expect(sendMessage('1234567890', 'test')).rejects.toThrow(
        'WhatsApp API returned status 400'
      )
    })

    it('should handle various error status codes', async () => {
      const errorCodes = [401, 403, 404, 500, 503]

      for (const code of errorCodes) {
        const mockFetch = vi.fn().mockResolvedValue({
          ok: false,
          status: code,
          text: async () => `Error ${code}`,
        })
        global.fetch = mockFetch

        await expect(sendMessage('1234567890', 'test')).rejects.toThrow(
          `WhatsApp API returned status ${code}`
        )
      }
    })

    it('should handle empty message text', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
      })
      global.fetch = mockFetch

      await sendMessage('1234567890', '')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"body":""'),
        })
      )
    })
  })
})
