import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  parseWebhookPayload,
  sanitizeMessageBody,
} from '@/lib/document-service'

describe('document-service.ts', () => {
  describe('Property-Based Tests', () => {
    it('parseWebhookPayload extracts from and text from valid payload', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => s.length > 0),
          fc.string().filter(s => s.length > 0),
          (from, text) => {
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

            const result = parseWebhookPayload(payload)
            expect(result).not.toBeNull()
            expect(result?.from).toBe(from)
            expect(result?.text).toBe(text)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Unit Tests - Edge Cases', () => {
    describe('parseWebhookPayload', () => {
      it('should return null when messages array is missing', () => {
        const payload = {
          entry: [
            {
              changes: [
                {
                  value: {},
                },
              ],
            },
          ],
        }
        expect(parseWebhookPayload(payload)).toBeNull()
      })

      it('should return null when messages array is empty', () => {
        const payload = {
          entry: [
            {
              changes: [
                {
                  value: {
                    messages: [],
                  },
                },
              ],
            },
          ],
        }
        expect(parseWebhookPayload(payload)).toBeNull()
      })

      it('should return null when from is missing', () => {
        const payload = {
          entry: [
            {
              changes: [
                {
                  value: {
                    messages: [
                      {
                        text: { body: 'hello' },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        }
        expect(parseWebhookPayload(payload)).toBeNull()
      })

      it('should return null when text is missing', () => {
        const payload = {
          entry: [
            {
              changes: [
                {
                  value: {
                    messages: [
                      {
                        from: '1234567890',
                      },
                    ],
                  },
                },
              ],
            },
          ],
        }
        expect(parseWebhookPayload(payload)).toBeNull()
      })

      it('should return null for malformed payload', () => {
        expect(parseWebhookPayload(null)).toBeNull()
        expect(parseWebhookPayload(undefined)).toBeNull()
        expect(parseWebhookPayload({})).toBeNull()
        expect(parseWebhookPayload({ entry: [] })).toBeNull()
      })
    })

    describe('sanitizeMessageBody', () => {
      it('should handle empty string', () => {
        expect(sanitizeMessageBody('')).toBe('')
      })

      it('should trim whitespace', () => {
        expect(sanitizeMessageBody('  hello  ')).toBe('hello')
      })
    })
  })
})
