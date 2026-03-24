import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { createHmac } from 'crypto'
import { validateSignature } from '@/lib/validate-signature'

describe('validate-signature.ts', () => {
  describe('Property-Based Tests', () => {
    // Feature: whatsapp-document-retrieval-bot, Property 3: Signature verification correctness
    it('accepts valid HMAC-SHA256 signatures and rejects invalid ones', () => {
      fc.assert(
        fc.property(
          fc.string(),
          fc.string().filter(s => s.length > 0),
          fc.string(),
          (body, secret, randomString) => {
            // Generate valid signature
            const validSignature = 'sha256=' + createHmac('sha256', secret)
              .update(body)
              .digest('hex')
            
            // Valid signature should be accepted
            expect(validateSignature(body, validSignature, secret)).toBe(true)
            
            // Invalid signature should be rejected
            const invalidSignature = 'sha256=' + randomString
            if (invalidSignature !== validSignature) {
              expect(validateSignature(body, invalidSignature, secret)).toBe(false)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Unit Tests - Edge Cases', () => {
    const testSecret = 'test-secret-key'
    const testBody = '{"test": "data"}'

    it('should accept valid signature', () => {
      const validSignature = 'sha256=' + createHmac('sha256', testSecret)
        .update(testBody)
        .digest('hex')
      
      expect(validateSignature(testBody, validSignature, testSecret)).toBe(true)
    })

    it('should reject signature without sha256= prefix', () => {
      const signature = createHmac('sha256', testSecret)
        .update(testBody)
        .digest('hex')
      
      expect(validateSignature(testBody, signature, testSecret)).toBe(false)
    })

    it('should reject empty signature', () => {
      expect(validateSignature(testBody, '', testSecret)).toBe(false)
    })

    it('should reject signature with wrong secret', () => {
      const signature = 'sha256=' + createHmac('sha256', 'wrong-secret')
        .update(testBody)
        .digest('hex')
      
      expect(validateSignature(testBody, signature, testSecret)).toBe(false)
    })

    it('should reject signature with modified body', () => {
      const signature = 'sha256=' + createHmac('sha256', testSecret)
        .update(testBody)
        .digest('hex')
      
      expect(validateSignature(testBody + 'modified', signature, testSecret)).toBe(false)
    })

    it('should reject completely invalid signature format', () => {
      expect(validateSignature(testBody, 'sha256=invalid', testSecret)).toBe(false)
      expect(validateSignature(testBody, 'invalid-format', testSecret)).toBe(false)
    })
  })
})
