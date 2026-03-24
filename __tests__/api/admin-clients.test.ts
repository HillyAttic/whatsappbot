import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { GET, POST } from '@/app/api/admin/clients/route'
import { PUT, DELETE } from '@/app/api/admin/clients/[id]/route'
import { NextRequest } from 'next/server'

// Mock dependencies
vi.mock('@/lib/firebase-admin', () => ({
  getFirestore: vi.fn(),
}))

vi.mock('@/lib/phone', () => ({
  normalizePhone: vi.fn((phone: string) => phone.replace(/\D/g, '')),
}))

vi.mock('@/lib/storage-service', () => ({
  deleteFile: vi.fn(),
}))

import { getFirestore } from '@/lib/firebase-admin'
import { deleteFile } from '@/lib/storage-service'

describe('admin clients API routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/admin/clients', () => {
    // Feature: whatsapp-document-retrieval-bot, Property 11: Client list shows all Firestore users
    it('returns all clients from Firestore users collection', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.string(),
              name: fc.string(),
              phone: fc.string(),
            }),
            { minLength: 0, maxLength: 10 }
          ),
          async (clients) => {
            const mockDocs = clients.map(client => ({
              id: client.id,
              data: () => ({ name: client.name, phone: client.phone }),
            }))

            const mockGet = vi.fn(async () => ({
              docs: mockDocs,
            }))

            const mockCollection = vi.fn(() => ({
              get: mockGet,
            }))

            vi.mocked(getFirestore).mockReturnValue({
              collection: mockCollection,
            } as any)

            const response = await GET()
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data).toHaveLength(clients.length)
            
            clients.forEach((client, index) => {
              expect(data[index]).toMatchObject({
                id: client.id,
                name: client.name,
                phone: client.phone,
              })
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return empty array when no clients exist', async () => {
      const mockGet = vi.fn(async () => ({
        docs: [],
      }))

      const mockCollection = vi.fn(() => ({
        get: mockGet,
      }))

      vi.mocked(getFirestore).mockReturnValue({
        collection: mockCollection,
      } as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual([])
    })

    it('should return 500 on Firestore error', async () => {
      const mockGet = vi.fn(async () => {
        throw new Error('Firestore error')
      })

      const mockCollection = vi.fn(() => ({
        get: mockGet,
      }))

      vi.mocked(getFirestore).mockReturnValue({
        collection: mockCollection,
      } as any)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error')
    })
  })

  describe('POST /api/admin/clients', () => {
    // Feature: whatsapp-document-retrieval-bot, Property 12: Client creation round-trip
    it('creates client with normalized phone and returns it', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            name: fc.string().filter(s => s.length > 0),
            phone: fc.string().filter(s => s.length > 0),
          }),
          async ({ name, phone }) => {
            const normalizedPhone = phone.replace(/\D/g, '')
            const mockDocId = 'test-doc-id'

            const mockGet = vi.fn(async () => ({
              id: mockDocId,
              data: () => ({ name, phone: normalizedPhone }),
            }))

            const mockAdd = vi.fn(async () => ({
              get: mockGet,
            }))

            const mockCollection = vi.fn(() => ({
              add: mockAdd,
            }))

            vi.mocked(getFirestore).mockReturnValue({
              collection: mockCollection,
            } as any)

            const req = new NextRequest('http://localhost:3000/api/admin/clients', {
              method: 'POST',
              body: JSON.stringify({ name, phone }),
            })

            const response = await POST(req)
            const data = await response.json()

            expect(response.status).toBe(201)
            expect(data).toMatchObject({
              id: mockDocId,
              name,
              phone: normalizedPhone,
            })
            
            expect(mockAdd).toHaveBeenCalledWith({
              name,
              phone: normalizedPhone,
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return 400 when name is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/clients', {
        method: 'POST',
        body: JSON.stringify({ phone: '1234567890' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
    })

    it('should return 400 when phone is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/clients', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test User' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
    })

    it('should return 500 on Firestore error', async () => {
      const mockAdd = vi.fn(async () => {
        throw new Error('Firestore error')
      })

      const mockCollection = vi.fn(() => ({
        add: mockAdd,
      }))

      vi.mocked(getFirestore).mockReturnValue({
        collection: mockCollection,
      } as any)

      const req = new NextRequest('http://localhost:3000/api/admin/clients', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test', phone: '123' }),
      })

      const response = await POST(req)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toHaveProperty('error')
    })
  })

  describe('PUT /api/admin/clients/[id]', () => {
    // Feature: whatsapp-document-retrieval-bot, Property 13: Client update is reflected in list
    it('updates client with normalized phone', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string().filter(s => s.length > 0),
            name: fc.string().filter(s => s.length > 0),
            phone: fc.string().filter(s => s.length > 0),
          }),
          async ({ id, name, phone }) => {
            const normalizedPhone = phone.replace(/\D/g, '')

            const mockGet = vi.fn(async () => ({
              id,
              data: () => ({ name, phone: normalizedPhone }),
            }))

            const mockUpdate = vi.fn(async () => {})

            const mockDoc = vi.fn(() => ({
              update: mockUpdate,
              get: mockGet,
            }))

            const mockCollection = vi.fn(() => ({
              doc: mockDoc,
            }))

            vi.mocked(getFirestore).mockReturnValue({
              collection: mockCollection,
            } as any)

            const req = new NextRequest(`http://localhost:3000/api/admin/clients/${id}`, {
              method: 'PUT',
              body: JSON.stringify({ name, phone }),
            })

            const response = await PUT(req, { params: { id } })
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data).toMatchObject({
              id,
              name,
              phone: normalizedPhone,
            })
            
            expect(mockUpdate).toHaveBeenCalledWith({
              name,
              phone: normalizedPhone,
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return 400 when name is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/clients/123', {
        method: 'PUT',
        body: JSON.stringify({ phone: '1234567890' }),
      })

      const response = await PUT(req, { params: { id: '123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
    })

    it('should return 400 when phone is missing', async () => {
      const req = new NextRequest('http://localhost:3000/api/admin/clients/123', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Test User' }),
      })

      const response = await PUT(req, { params: { id: '123' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('required')
    })
  })

  describe('DELETE /api/admin/clients/[id]', () => {
    // Feature: whatsapp-document-retrieval-bot, Property 14: Client delete removes user record
    // Feature: whatsapp-document-retrieval-bot, Property 15: Cascading delete removes all client documents
    it('deletes client and cascades to documents and files', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.string().filter(s => s.length > 0),
            phone: fc.string().filter(s => /^\d+$/.test(s) && s.length > 0),
          }),
          fc.array(
            fc.record({
              id: fc.string(),
              filePath: fc.string().filter(s => s.length > 0),
            }),
            { minLength: 0, maxLength: 5 }
          ),
          async ({ id, phone }, documents) => {
            vi.clearAllMocks()
            const mockUserGet = vi.fn(async () => ({
              exists: true,
              data: () => ({ phone }),
            }))

            const mockDocumentsGet = vi.fn(async () => ({
              docs: documents.map(doc => ({
                id: doc.id,
                ref: { path: `documents/${doc.id}` },
                data: () => ({ filePath: doc.filePath }),
              })),
            }))

            const mockBatchDelete = vi.fn()
            const mockBatchCommit = vi.fn(async () => {})

            const mockBatch = vi.fn(() => ({
              delete: mockBatchDelete,
              commit: mockBatchCommit,
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
              batch: mockBatch,
            } as any)

            vi.mocked(deleteFile).mockResolvedValue()

            const req = new NextRequest(`http://localhost:3000/api/admin/clients/${id}`, {
              method: 'DELETE',
            })

            const response = await DELETE(req, { params: { id } })
            const data = await response.json()

            expect(response.status).toBe(200)
            expect(data.success).toBe(true)
            
            // Verify files were deleted
            expect(deleteFile).toHaveBeenCalledTimes(documents.length)
            documents.forEach(doc => {
              expect(deleteFile).toHaveBeenCalledWith(doc.filePath)
            })
            
            // Verify batch operations
            expect(mockBatchDelete).toHaveBeenCalledTimes(documents.length + 1) // docs + user
            expect(mockBatchCommit).toHaveBeenCalled()
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

      const req = new NextRequest('http://localhost:3000/api/admin/clients/nonexistent', {
        method: 'DELETE',
      })

      const response = await DELETE(req, { params: { id: 'nonexistent' } })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toContain('not found')
    })

    it('should continue deletion even if file delete fails', async () => {
      const mockUserGet = vi.fn(async () => ({
        exists: true,
        data: () => ({ phone: '123' }),
      }))

      const mockDocumentsGet = vi.fn(async () => ({
        docs: [
          {
            id: 'doc1',
            ref: { path: 'documents/doc1' },
            data: () => ({ filePath: 'path/1' }),
          },
        ],
      }))

      const mockBatchDelete = vi.fn()
      const mockBatchCommit = vi.fn(async () => {})

      const mockBatch = vi.fn(() => ({
        delete: mockBatchDelete,
        commit: mockBatchCommit,
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
        batch: mockBatch,
      } as any)

      vi.mocked(deleteFile).mockRejectedValue(new Error('Storage error'))

      const req = new NextRequest('http://localhost:3000/api/admin/clients/123', {
        method: 'DELETE',
      })

      const response = await DELETE(req, { params: { id: '123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockBatchCommit).toHaveBeenCalled()
    })
  })
})
