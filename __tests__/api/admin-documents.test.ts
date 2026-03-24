import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { GET, POST } from '@/app/api/admin/clients/[id]/documents/route'
import { PUT, DELETE } from '@/app/api/admin/clients/[id]/documents/[docId]/route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/firebase-admin', () => ({
  getFirestore: vi.fn(),
}))

vi.mock('@/lib/storage-service', () => ({
  uploadFile: vi.fn(),
  deleteFile: vi.fn(),
}))

import { getFirestore } from '@/lib/firebase-admin'
import { uploadFile, deleteFile } from '@/lib/storage-service'

// Helper: create a mock FormData-like object to bypass jsdom's multipart Content-Type issue
function makeMockFormData(title?: string, file?: { name: string }) {
  return {
    get(key: string) {
      if (key === 'title') return title ?? null
      if (key === 'file') {
        if (!file) return null
        return {
          name: file.name,
          arrayBuffer: async () => new ArrayBuffer(4),
        }
      }
      return null
    },
  } as any
}

describe('admin documents API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('GET /api/admin/clients/[id]/documents', () => {
    // Feature: whatsapp-document-retrieval-bot, Property 16: Document list shows all documents for client
    it('returns all documents for a client', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string().filter(s => s.length > 0),
            phone: fc.string().filter(s => /^\d+$/.test(s) && s.length > 0),
          }),
          fc.array(
            fc.record({
              id: fc.string(),
              phone: fc.string(),
              title: fc.string(),
              filePath: fc.string(),
            }),
            { minLength: 0, maxLength: 10 }
          ),
          async (client, documents) => {
            const mockUserGet = vi.fn(async () => ({
              exists: true,
              data: () => ({ phone: client.phone }),
            }))

            const mockDocumentsGet = vi.fn(async () => ({
              docs: documents.map(doc => ({
                id: doc.id,
                data: () => ({ phone: doc.phone, title: doc.title, filePath: doc.filePath }),
              })),
            }))

            const mockWhere = vi.fn(() => ({
              get: mockDocumentsGet,
            }))

            const mockDoc = vi.fn(() => ({
              get: mockUserGet,
            }))

            const mockCollection = vi.fn((name: string) => {
              if (name === 'users') {
                return { doc: mockDoc }
              }
              return { where: mockWhere }
            })

            vi.mocked(getFirestore).mockReturnValue({
              collection: mockCollection,
            } as any)

            const req = new NextRequest(`http://localhost:3000/api/admin/clients/${client.id}/documents`)

            const response = await GET(req, { params: { id: client.id } })
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data).toHaveLength(documents.length)

            // Verify all documents are returned with correct fields
            documents.forEach((doc, index) => {
              expect(data[index]).toMatchObject({
                id: doc.id,
                phone: doc.phone,
                title: doc.title,
                filePath: doc.filePath,
              })
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return 404 when client does not exist', async () => {
      const mockUserGet = vi.fn(async () => ({
        exists: false,
      }))

      const mockDoc = vi.fn(() => ({
        get: mockUserGet,
      }))

      const mockCollection = vi.fn(() => ({
        doc: mockDoc,
      }))

      vi.mocked(getFirestore).mockReturnValue({
        collection: mockCollection,
      } as any)

      const req = new NextRequest('http://localhost:3000/api/admin/clients/nonexistent/documents')

      const response = await GET(req, { params: { id: 'nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })

    it('should return empty array when client has no documents', async () => {
      const mockUserGet = vi.fn(async () => ({
        exists: true,
        data: () => ({ phone: '123' }),
      }))

      const mockDocumentsGet = vi.fn(async () => ({
        docs: [],
      }))

      const mockWhere = vi.fn(() => ({
        get: mockDocumentsGet,
      }))

      const mockDoc = vi.fn(() => ({
        get: mockUserGet,
      }))

      const mockCollection = vi.fn((name: string) => {
        if (name === 'users') {
          return { doc: mockDoc }
        }
        return { where: mockWhere }
      })

      vi.mocked(getFirestore).mockReturnValue({
        collection: mockCollection,
      } as any)

      const req = new NextRequest('http://localhost:3000/api/admin/clients/123/documents')

      const response = await GET(req, { params: { id: '123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })
  })

  describe('POST /api/admin/clients/[id]/documents', () => {
    // Feature: whatsapp-document-retrieval-bot, Property 17: Document CRUD round-trip (create)
    // Feature: whatsapp-document-retrieval-bot, Property 19: File upload stores filePath
    it('creates document with file upload and correct filePath', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            clientId: fc.string().filter(s => s.length > 0),
            phone: fc.string().filter(s => /^\d+$/.test(s) && s.length > 0),
            title: fc.string().filter(s => s.length > 0),
            filename: fc.string().filter(s => s.length > 0 && !s.includes('/')),
          }),
          async ({ clientId, phone, title, filename }) => {
            vi.restoreAllMocks()
            vi.clearAllMocks()

            const expectedFilePath = `users/${phone}/documents/${filename}`

            const mockUserGet = vi.fn(async () => ({
              exists: true,
              data: () => ({ phone }),
            }))

            const mockDocGet = vi.fn(async () => ({
              id: 'new-doc-id',
              data: () => ({ phone, title, filePath: expectedFilePath }),
            }))

            const mockAdd = vi.fn(async () => ({
              get: mockDocGet,
            }))

            const mockDoc = vi.fn(() => ({
              get: mockUserGet,
            }))

            const mockCollection = vi.fn((name: string) => {
              if (name === 'users') {
                return { doc: mockDoc }
              }
              return { add: mockAdd }
            })

            vi.mocked(getFirestore).mockReturnValue({
              collection: mockCollection,
            } as any)

            vi.mocked(uploadFile).mockResolvedValue(expectedFilePath)

            vi.spyOn(NextRequest.prototype, 'formData').mockResolvedValueOnce(
              makeMockFormData(title, { name: filename })
            )

            const req = new NextRequest(`http://localhost:3000/api/admin/clients/${clientId}/documents`, {
              method: 'POST',
            })

            const response = await POST(req, { params: { id: clientId } })
            const data = await response.json()

            expect(response.status).toBe(201)
            expect(data).toMatchObject({
              id: 'new-doc-id',
              phone,
              title,
              filePath: expectedFilePath,
            })

            expect(uploadFile).toHaveBeenCalledWith(
              phone,
              expect.any(Buffer),
              filename
            )

            expect(mockAdd).toHaveBeenCalledWith({
              phone,
              title,
              filePath: expectedFilePath,
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return 400 when title is missing', async () => {
      const mockUserGet = vi.fn(async () => ({
        exists: true,
        data: () => ({ phone: '123' }),
      }))

      const mockDoc = vi.fn(() => ({
        get: mockUserGet,
      }))

      const mockCollection = vi.fn(() => ({
        doc: mockDoc,
      }))

      vi.mocked(getFirestore).mockReturnValue({
        collection: mockCollection,
      } as any)

      vi.spyOn(NextRequest.prototype, 'formData').mockResolvedValueOnce(
        makeMockFormData(undefined, { name: 'test.pdf' })
      )

      const req = new NextRequest('http://localhost:3000/api/admin/clients/123/documents', {
        method: 'POST',
      })

      const response = await POST(req, { params: { id: '123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
    })

    it('should return 400 when file is missing', async () => {
      const mockUserGet = vi.fn(async () => ({
        exists: true,
        data: () => ({ phone: '123' }),
      }))

      const mockDoc = vi.fn(() => ({
        get: mockUserGet,
      }))

      const mockCollection = vi.fn(() => ({
        doc: mockDoc,
      }))

      vi.mocked(getFirestore).mockReturnValue({
        collection: mockCollection,
      } as any)

      vi.spyOn(NextRequest.prototype, 'formData').mockResolvedValueOnce(
        makeMockFormData('Test Document', undefined)
      )

      const req = new NextRequest('http://localhost:3000/api/admin/clients/123/documents', {
        method: 'POST',
      })

      const response = await POST(req, { params: { id: '123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
    })

    it('should return 500 when file upload fails', async () => {
      const mockUserGet = vi.fn(async () => ({
        exists: true,
        data: () => ({ phone: '123' }),
      }))

      const mockDoc = vi.fn(() => ({
        get: mockUserGet,
      }))

      const mockCollection = vi.fn(() => ({
        doc: mockDoc,
      }))

      vi.mocked(getFirestore).mockReturnValue({
        collection: mockCollection,
      } as any)

      vi.mocked(uploadFile).mockRejectedValue(new Error('Upload failed'))

      vi.spyOn(NextRequest.prototype, 'formData').mockResolvedValueOnce(
        makeMockFormData('Test', { name: 'test.pdf' })
      )

      const req = new NextRequest('http://localhost:3000/api/admin/clients/123/documents', {
        method: 'POST',
      })

      const response = await POST(req, { params: { id: '123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error')
    })
  })

  describe('PUT /api/admin/clients/[id]/documents/[docId]', () => {
    // Feature: whatsapp-document-retrieval-bot, Property 17: Document CRUD round-trip (update)
    it('updates document title and optionally file', async () => {
      const mockDocGet = vi.fn(async () => ({
        exists: true,
        data: () => ({ phone: '123', title: 'Old Title', filePath: 'old/path' }),
      }))

      const mockUpdate = vi.fn(async () => {})

      const mockUpdatedDocGet = vi.fn(async () => ({
        id: 'doc-id',
        data: () => ({ phone: '123', title: 'New Title', filePath: 'new/path' }),
      }))

      const mockDoc = vi.fn()
        .mockReturnValueOnce({
          get: mockDocGet,
          update: mockUpdate,
        })
        .mockReturnValueOnce({
          get: mockUpdatedDocGet,
        })

      const mockCollection = vi.fn(() => ({
        doc: mockDoc,
      }))

      vi.mocked(getFirestore).mockReturnValue({
        collection: mockCollection,
      } as any)

      vi.mocked(uploadFile).mockResolvedValue('new/path')
      vi.mocked(deleteFile).mockResolvedValue()

      vi.spyOn(NextRequest.prototype, 'formData').mockResolvedValueOnce(
        makeMockFormData('New Title', { name: 'new.pdf' })
      )

      const req = new NextRequest('http://localhost:3000/api/admin/clients/123/documents/doc-id', {
        method: 'PUT',
      })

      const response = await PUT(req, { params: { id: '123', docId: 'doc-id' } })

      expect(mockUpdate).toHaveBeenCalledWith({
        title: 'New Title',
        filePath: 'new/path',
      })

      expect(uploadFile).toHaveBeenCalled()
      expect(deleteFile).toHaveBeenCalledWith('old/path')
    })

    it('should update only title when no file provided', async () => {
      const mockDocGet = vi.fn(async () => ({
        exists: true,
        data: () => ({ phone: '123', title: 'Old Title', filePath: 'old/path' }),
      }))

      const mockUpdate = vi.fn(async () => {})

      const mockUpdatedDocGet = vi.fn(async () => ({
        id: 'doc-id',
        data: () => ({ phone: '123', title: 'New Title', filePath: 'old/path' }),
      }))

      const mockDoc = vi.fn()
        .mockReturnValueOnce({
          get: mockDocGet,
          update: mockUpdate,
        })
        .mockReturnValueOnce({
          get: mockUpdatedDocGet,
        })

      const mockCollection = vi.fn(() => ({
        doc: mockDoc,
      }))

      vi.mocked(getFirestore).mockReturnValue({
        collection: mockCollection,
      } as any)

      vi.spyOn(NextRequest.prototype, 'formData').mockResolvedValueOnce(
        makeMockFormData('New Title', undefined)
      )

      const req = new NextRequest('http://localhost:3000/api/admin/clients/123/documents/doc-id', {
        method: 'PUT',
      })

      const response = await PUT(req, { params: { id: '123', docId: 'doc-id' } })

      expect(mockUpdate).toHaveBeenCalledWith({
        title: 'New Title',
        filePath: 'old/path',
      })

      expect(uploadFile).not.toHaveBeenCalled()
      expect(deleteFile).not.toHaveBeenCalled()
    })

    it('should return 400 when title is missing', async () => {
      const mockDocGet = vi.fn(async () => ({
        exists: true,
        data: () => ({ phone: '123' }),
      }))

      const mockDoc = vi.fn(() => ({
        get: mockDocGet,
      }))

      const mockCollection = vi.fn(() => ({
        doc: mockDoc,
      }))

      vi.mocked(getFirestore).mockReturnValue({
        collection: mockCollection,
      } as any)

      vi.spyOn(NextRequest.prototype, 'formData').mockResolvedValueOnce(
        makeMockFormData(undefined, undefined)
      )

      const req = new NextRequest('http://localhost:3000/api/admin/clients/123/documents/doc-id', {
        method: 'PUT',
      })

      const response = await PUT(req, { params: { id: '123', docId: 'doc-id' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
    })
  })

  describe('DELETE /api/admin/clients/[id]/documents/[docId]', () => {
    // Feature: whatsapp-document-retrieval-bot, Property 17: Document CRUD round-trip (delete)
    // Feature: whatsapp-document-retrieval-bot, Property 20: File deletion on document delete
    it('deletes document and file from storage', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            clientId: fc.string().filter(s => s.length > 0),
            docId: fc.string().filter(s => s.length > 0),
            filePath: fc.string().filter(s => s.length > 0),
          }),
          async ({ clientId, docId, filePath }) => {
            const mockDocGet = vi.fn(async () => ({
              exists: true,
              data: () => ({ filePath }),
            }))

            const mockDelete = vi.fn(async () => {})

            const mockDoc = vi.fn(() => ({
              get: mockDocGet,
              delete: mockDelete,
            }))

            const mockCollection = vi.fn(() => ({
              doc: mockDoc,
            }))

            vi.mocked(getFirestore).mockReturnValue({
              collection: mockCollection,
            } as any)

            vi.mocked(deleteFile).mockResolvedValue()

            const req = new NextRequest(`http://localhost:3000/api/admin/clients/${clientId}/documents/${docId}`, {
              method: 'DELETE',
            })

            const response = await DELETE(req, { params: { id: clientId, docId } })
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.success).toBe(true)

            // Verify file was deleted first
            expect(deleteFile).toHaveBeenCalledWith(filePath)

            // Verify document was deleted from Firestore
            expect(mockDelete).toHaveBeenCalled()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return 404 when document does not exist', async () => {
      const mockDocGet = vi.fn(async () => ({
        exists: false,
      }))

      const mockDoc = vi.fn(() => ({
        get: mockDocGet,
      }))

      const mockCollection = vi.fn(() => ({
        doc: mockDoc,
      }))

      vi.mocked(getFirestore).mockReturnValue({
        collection: mockCollection,
      } as any)

      const req = new NextRequest('http://localhost:3000/api/admin/clients/123/documents/nonexistent', {
        method: 'DELETE',
      })

      const response = await DELETE(req, { params: { id: '123', docId: 'nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })

    it('should return 500 when file delete fails', async () => {
      const mockDocGet = vi.fn(async () => ({
        exists: true,
        data: () => ({ filePath: 'test/path' }),
      }))

      const mockDoc = vi.fn(() => ({
        get: mockDocGet,
      }))

      const mockCollection = vi.fn(() => ({
        doc: mockDoc,
      }))

      vi.mocked(getFirestore).mockReturnValue({
        collection: mockCollection,
      } as any)

      vi.mocked(deleteFile).mockRejectedValue(new Error('Storage error'))

      const req = new NextRequest('http://localhost:3000/api/admin/clients/123/documents/doc-id', {
        method: 'DELETE',
      })

      const response = await DELETE(req, { params: { id: '123', docId: 'doc-id' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toContain('storage')
    })
  })
})
