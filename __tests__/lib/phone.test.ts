import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { normalizePhone } from '@/lib/phone'

describe('phone.ts', () => {
  describe('Property-Based Tests', () => {
    // Feature: whatsapp-document-retrieval-bot, Property 4: Phone normalization strips all non-numeric characters
    it('normalizePhone returns only digits in original order', () => {
      fc.assert(
        fc.property(fc.string(), (raw) => {
          const result = normalizePhone(raw)
          
          // Result should contain only digits
          expect(result).toMatch(/^\d*$/)
          
          // Digits in result should match digits in input in same order
          const inputDigits = raw.replace(/\D/g, '')
          expect(result).toBe(inputDigits)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe('Unit Tests - Edge Cases', () => {
    it('should handle empty string', () => {
      expect(normalizePhone('')).toBe('')
    })

    it('should handle string with no digits', () => {
      expect(normalizePhone('abc-def')).toBe('')
    })

    it('should handle string with only digits', () => {
      expect(normalizePhone('1234567890')).toBe('1234567890')
    })

    it('should strip common phone formatting characters', () => {
      expect(normalizePhone('+1 (555) 123-4567')).toBe('15551234567')
      expect(normalizePhone('1-555-123-4567')).toBe('15551234567')
      expect(normalizePhone('+91 98765 43210')).toBe('919876543210')
    })

    it('should handle special characters and spaces', () => {
      expect(normalizePhone('  +1 (555) 123-4567  ')).toBe('15551234567')
      expect(normalizePhone('555.123.4567')).toBe('5551234567')
    })
  })
})
