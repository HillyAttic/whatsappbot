'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ClientList from '@/components/admin/ClientList'
import ClientForm from '@/components/admin/ClientForm'
import ConfirmDialog from '@/components/admin/ConfirmDialog'

interface ClientRecord {
  id: string
  name: string
  phone: string
}

export default function ClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<ClientRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null)
  const [deletingClient, setDeletingClient] = useState<ClientRecord | null>(null)

  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/clients')
      if (!response.ok) {
        throw new Error('Failed to fetch clients')
      }
      const data = await response.json()
      setClients(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (data: { name: string; phone: string }) => {
    try {
      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create client')
      }

      await fetchClients()
      setShowForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleUpdate = async (data: { name: string; phone: string }) => {
    if (!editingClient) return

    try {
      const response = await fetch(`/api/admin/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update client')
      }

      await fetchClients()
      setEditingClient(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleDelete = async () => {
    if (!deletingClient) return

    try {
      const response = await fetch(`/api/admin/clients/${deletingClient.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete client')
      }

      await fetchClients()
      setDeletingClient(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setDeletingClient(null)
    }
  }

  const handleViewDocuments = (client: ClientRecord) => {
    router.push(`/admin/clients/${client.id}/documents`)
  }

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Clients</h1>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Client
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {showForm && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Create Client</h2>
          <ClientForm
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {editingClient && (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Edit Client</h2>
          <ClientForm
            initial={editingClient}
            onSubmit={handleUpdate}
            onCancel={() => setEditingClient(null)}
          />
        </div>
      )}

      <ClientList
        clients={clients}
        onEdit={setEditingClient}
        onDelete={setDeletingClient}
        onViewDocuments={handleViewDocuments}
      />

      {deletingClient && (
        <ConfirmDialog
          message={`Are you sure you want to delete ${deletingClient.name}? This will also delete all their documents.`}
          onConfirm={handleDelete}
          onCancel={() => setDeletingClient(null)}
        />
      )}
    </div>
  )
}
