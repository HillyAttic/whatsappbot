'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DocumentList from '@/components/admin/DocumentList'
import DocumentForm from '@/components/admin/DocumentForm'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

interface DocumentRecord {
  id: string
  phone: string
  title: string
  filePath: string
}

export default function DocumentsPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingDocument, setEditingDocument] = useState<DocumentRecord | null>(null)
  const [deletingDocument, setDeletingDocument] = useState<DocumentRecord | null>(null)

  useEffect(() => {
    fetchDocuments()
  }, [clientId])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/clients/${clientId}/documents`)
      if (!response.ok) {
        throw new Error('Failed to fetch documents')
      }
      const data = await response.json()
      setDocuments(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (data: { title: string; file: File | null }) => {
    if (!data.file) return

    try {
      const formData = new FormData()
      formData.append('title', data.title)
      formData.append('file', data.file)

      const response = await fetch(`/api/admin/clients/${clientId}/documents`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to create document')
      }

      await fetchDocuments()
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleUpdate = async (data: { title: string; file: File | null }) => {
    if (!editingDocument) return

    try {
      const formData = new FormData()
      formData.append('title', data.title)
      if (data.file) {
        formData.append('file', data.file)
      }

      const response = await fetch(
        `/api/admin/clients/${clientId}/documents/${editingDocument.id}`,
        {
          method: 'PUT',
          body: formData,
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update document')
      }

      await fetchDocuments()
      setEditingDocument(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleDelete = async () => {
    if (!deletingDocument) return

    try {
      const response = await fetch(
        `/api/admin/clients/${clientId}/documents/${deletingDocument.id}`,
        {
          method: 'DELETE',
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete document')
      }

      await fetchDocuments()
      setDeletingDocument(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setDeletingDocument(null)
    }
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <button
            onClick={() => router.push('/admin/clients')}
            className="text-blue-600 hover:text-blue-800 mb-2"
          >
            ← Back to Clients
          </button>
          <h1 className="text-3xl font-bold text-gray-800">Documents</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Document
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Create Document</h2>
          <DocumentForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {editingDocument && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Edit Document</h2>
          <DocumentForm
            initial={editingDocument}
            onSubmit={handleUpdate}
            onCancel={() => setEditingDocument(null)}
          />
        </div>
      )}

      <DocumentList
        documents={documents}
        onEdit={setEditingDocument}
        onDelete={setDeletingDocument}
      />

      {deletingDocument && (
        <ConfirmDialog
          message={`Are you sure you want to delete "${deletingDocument.title}"?`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingDocument(null)}
        />
      )}
    </div>
  )
}
