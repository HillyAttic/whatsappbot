import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as fc from 'fast-check'
import {
  parseWebhookPayload,
  sanitizeMessageBody,
  storeSession,
  getSession,
  type DocumentRecord,
} from '@/lib/document-service'

describe('document-service.ts', () => {
  describe('Property-Based Tests', () => {
    // Feature: whatsapp-document-retrieval-bot, Property 5: Message parser extracts correct fields
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

    // Feature: whatsapp-document-retrieval-bot, Property 10: Message body sanitization
    it('sanitizeMessageBody removes non-alphanumeric chars and truncates to 256', () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const result = sanitizeMessageBody(input)
          
          // Should contain only alphanumeric, spaces, and standard punctuation
          expect(result).toMatch(/^[a-zA-Z0-9\s.,!?;:'"()-]*$/)
          
          // Should be at most 256 characters
          expect(result.length).toBeLessThanOrEqual(256)
          
          // If input was <= 256 after sanitization, result should match sanitized input
          const sanitized = input.replace(/[^a-zA-Z0-9\s.,!?;:'"()-]/g, '')
          if (sanitized.length <= 256) {
            expect(result).toBe(sanitized)
          } else {
            expect(result).toBe(sanitized.slice(0, 256))
          }
        }),
        { numRuns: 100 }
      )
    })

    // Feature: whatsapp-document-retrieval-bot, Property 8: Session stores filePaths
    it('session stores and retrieves document filePaths correctly', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => s.length > 0),
          fc.array(
            fc.record({
              id: fc.string(),
              phone: fc.string(),
              title: fc.string(),
              filePath: fc.string(),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (phone, documents) => {
            storeSession(phone, documents)
            const retrieved = getSession(phone)
            
            expect(retrieved).toEqual(documents)
            
            // Verify filePaths are preserved
            documents.forEach((doc, index) => {
              expect(retrieved?.[index]?.filePath).toBe(doc.filePath)
            })
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

      it('should preserve alphanumeric and standard punctuation', () => {
        expect(sanitizeMessageBody('Hello, World!')).toBe('Hello, World!')
        expect(sanitizeMessageBody('Test 123')).toBe('Test 123')
        expect(sanitizeMessageBody("It's a test.")).toBe("It's a test.")
      })

      it('should remove special characters', () => {
        expect(sanitizeMessageBody('Hello@#$%World')).toBe('HelloWorld')
        expect(sanitizeMessageBody('Test<script>alert()</script>')).toBe('Testscriptalert()script')
      })

      it('should truncate to 256 characters', () => {
        const longString = 'a'.repeat(300)
        const result = sanitizeMessageBody(longString)
        expect(result.length).toBe(256)
        expect(result).toBe('a'.repeat(256))
      })
    })

    describe('session management', () => {
      beforeEach(() => {
        // Clear sessions between tests
        const phone = '1234567890'
        getSession(phone) // Just to ensure we're working with a clean state
      })

      it('should return undefined for non-existent session', () => {
        expect(getSession('nonexistent')).toBeUndefined()
      })

      it('should store and retrieve session', () => {
        const phone = '1234567890'
        const documents: DocumentRecord[] = [
          { id: '1', phone, title: 'Doc 1', filePath: 'path/1' },
          { id: '2', phone, title: 'Doc 2', filePath: 'path/2' },
        ]

        storeSession(phone, documents)
        expect(getSession(phone)).toEqual(documents)
      })

      it('should handle empty document array', () => {
        const phone = '1234567890'
        storeSession(phone, [])
        expect(getSession(phone)).toEqual([])
      })

      it('should overwrite existing session', () => {
        const phone = '1234567890'
        const docs1: DocumentRecord[] = [
          { id: '1', phone, title: 'Doc 1', filePath: 'path/1' },
        ]
        const docs2: DocumentRecord[] = [
          { id: '2', phone, title: 'Doc 2', filePath: 'path/2' },
        ]

        storeSession(phone, docs1)
        storeSession(phone, docs2)
        expect(getSession(phone)).toEqual(docs2)
      })
    })
  })
})
