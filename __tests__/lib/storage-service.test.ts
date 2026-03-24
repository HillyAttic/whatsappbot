import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'

// Mock firebase-admin before importing storage-service
vi.mock('@/lib/firebase-admin', () => ({
  getStorage: vi.fn(() => ({
    bucket: vi.fn(() => ({
      file: vi.fn((path: string) => ({
        getSignedUrl: vi.fn(async () => [`https://storage.googleapis.com/signed-url?path=${path}`]),
        save: vi.fn(async () => {}),
        delete: vi.fn(async () => {}),
      })),
    })),
  })),
}))

import { generateSignedUrl, uploadFile, deleteFile } from '@/lib/storage-service'
import { getStorage } from '@/lib/firebase-admin'

describe('storage-service.ts', () => {
  describe('Property-Based Tests', () => {
    // Feature: whatsapp-document-retrieval-bot, Property 18: Signed URLs expire after 5 minutes
    it('generateSignedUrl creates URL with 5-minute expiration', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string().filter(s => s.length > 0),
          async (filePath) => {
            const mockGetSignedUrl = vi.fn(async (options: any) => {
              // Verify expiration is approximately 5 minutes from now
              const now = Date.now()
              const fiveMinutes = 5 * 60 * 1000
              const expirationTime = options.expires
              
              expect(expirationTime).toBeGreaterThanOrEqual(now + fiveMinutes - 1000)
              expect(expirationTime).toBeLessThanOrEqual(now + fiveMinutes + 1000)
              
              return [`https://storage.googleapis.com/signed-url?path=${filePath}`]
            })

            const mockFile = {
              getSignedUrl: mockGetSignedUrl,
            }

            const mockBucket = {
              file: vi.fn(() => mockFile),
            }

            vi.mocked(getStorage).mockReturnValue({
              bucket: vi.fn(() => mockBucket),
            } as any)

            await generateSignedUrl(filePath)
            
            expect(mockGetSignedUrl).toHaveBeenCalledWith(
              expect.objectContaining({
                action: 'read',
                expires: expect.any(Number),
              })
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    // Feature: whatsapp-document-retrieval-bot, Property 19: File upload stores filePath
    it('uploadFile returns correct filePath pattern', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string().filter(s => /^\d+$/.test(s) && s.length > 0),
          fc.string().filter(s => s.length > 0 && !s.includes('/')),
          async (phone, filename) => {
            const mockSave = vi.fn(async () => {})
            const mockFile = {
              save: mockSave,
            }

            const mockBucket = {
              file: vi.fn(() => mockFile),
            }

            vi.mocked(getStorage).mockReturnValue({
              bucket: vi.fn(() => mockBucket),
            } as any)

            const buffer = Buffer.from('test content')
            const result = await uploadFile(phone, buffer, filename)
            
            // Verify filePath matches pattern users/{phone}/documents/{filename}
            expect(result).toBe(`users/${phone}/documents/${filename}`)
            
            expect(mockSave).toHaveBeenCalledWith(
              buffer,
              expect.objectContaining({
                metadata: expect.any(Object),
              })
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    // Feature: whatsapp-document-retrieval-bot, Property 20: File deletion on document delete
    it('deleteFile removes file from Firebase Storage', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string().filter(s => s.length > 0),
          async (filePath) => {
            const mockDelete = vi.fn(async () => {})
            const mockFile = {
              delete: mockDelete,
            }

            const mockBucket = {
              file: vi.fn(() => mockFile),
            }

            vi.mocked(getStorage).mockReturnValue({
              bucket: vi.fn(() => mockBucket),
            } as any)

            await deleteFile(filePath)
            
            expect(mockDelete).toHaveBeenCalled()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Unit Tests - Edge Cases', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    describe('generateSignedUrl', () => {
      it('should generate signed URL with read action', async () => {
        const mockGetSignedUrl = vi.fn(async () => ['https://example.com/signed-url'])
        const mockFile = {
          getSignedUrl: mockGetSignedUrl,
        }
        const mockBucket = {
          file: vi.fn(() => mockFile),
        }

        vi.mocked(getStorage).mockReturnValue({
          bucket: vi.fn(() => mockBucket),
        } as any)

        const url = await generateSignedUrl('users/123/documents/test.pdf')
        
        expect(url).toBe('https://example.com/signed-url')
        expect(mockGetSignedUrl).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'read',
          })
        )
      })

      it('should throw error when Firebase Storage fails', async () => {
        const mockGetSignedUrl = vi.fn(async () => {
          throw new Error('Storage error')
        })
        const mockFile = {
          getSignedUrl: mockGetSignedUrl,
        }
        const mockBucket = {
          file: vi.fn(() => mockFile),
        }

        vi.mocked(getStorage).mockReturnValue({
          bucket: vi.fn(() => mockBucket),
        } as any)

        await expect(generateSignedUrl('test/path')).rejects.toThrow('Storage error')
      })
    })

    describe('uploadFile', () => {
      it('should upload file with correct path pattern', async () => {
        const mockSave = vi.fn(async () => {})
        const mockFile = {
          save: mockSave,
        }
        const mockBucket = {
          file: vi.fn(() => mockFile),
        }

        vi.mocked(getStorage).mockReturnValue({
          bucket: vi.fn(() => mockBucket),
        } as any)

        const buffer = Buffer.from('test content')
        const result = await uploadFile('15551234567', buffer, 'invoice.pdf')
        
        expect(result).toBe('users/15551234567/documents/invoice.pdf')
        expect(mockSave).toHaveBeenCalledWith(buffer, expect.any(Object))
      })

      it('should throw error when upload fails', async () => {
        const mockSave = vi.fn(async () => {
          throw new Error('Upload failed')
        })
        const mockFile = {
          save: mockSave,
        }
        const mockBucket = {
          file: vi.fn(() => mockFile),
        }

        vi.mocked(getStorage).mockReturnValue({
          bucket: vi.fn(() => mockBucket),
        } as any)

        const buffer = Buffer.from('test')
        await expect(uploadFile('123', buffer, 'test.pdf')).rejects.toThrow('Upload failed')
      })
    })

    describe('deleteFile', () => {
      it('should delete file from storage', async () => {
        const mockDelete = vi.fn(async () => {})
        const mockFile = {
          delete: mockDelete,
        }
        const mockBucket = {
          file: vi.fn(() => mockFile),
        }

        vi.mocked(getStorage).mockReturnValue({
          bucket: vi.fn(() => mockBucket),
        } as any)

        await deleteFile('users/123/documents/test.pdf')
        
        expect(mockDelete).toHaveBeenCalled()
      })

      it('should throw error when delete fails', async () => {
        const mockDelete = vi.fn(async () => {
          throw new Error('Delete failed')
        })
        const mockFile = {
          delete: mockDelete,
        }
        const mockBucket = {
          file: vi.fn(() => mockFile),
        }

        vi.mocked(getStorage).mockReturnValue({
          bucket: vi.fn(() => mockBucket),
        } as any)

        await expect(deleteFile('test/path')).rejects.toThrow('Delete failed')
      })
    })
  })
})
