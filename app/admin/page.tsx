'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface Client {
  id: string
  name: string
  phone: string
}

interface Document {
  id: string
  title: string
  filePath: string
  uploadedAt: string
}

export default function AdminPage() {
  const { user, signOut } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  
  // Client form
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [showClientForm, setShowClientForm] = useState(false)
  
  // Document form
  const [docTitle, setDocTitle] = useState('')
  const [docFile, setDocFile] = useState<File | null>(null)
  const [showDocForm, setShowDocForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [migrating, setMigrating] = useState(false)

  // Load clients
  useEffect(() => {
    loadClients()
  }, [])

  // Load documents when client is selected
  useEffect(() => {
    if (selectedClient) {
      loadDocuments(selectedClient.id)
    }
  }, [selectedClient])

  const { getToken } = useAuth()

  const loadClients = async () => {
    try {
      const token = getToken()
      const res = await fetch('/api/admin/clients', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        console.error('Failed to load clients:', res.status, errorData)
        alert(`Failed to load clients: ${errorData.error || 'Unknown error'}`)
        return
      }
      
      const data = await res.json()
      console.log('Loaded clients:', data)
      setClients(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading clients:', error)
      alert('Failed to load clients. Check console for details.')
    }
  }

  const loadDocuments = async (clientId: string) => {
    try {
      setLoading(true)
      const token = getToken()
      const res = await fetch(`/api/admin/clients/${clientId}/documents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await res.json()
      setDocuments(data)
    } catch (error) {
      console.error('Error loading documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = getToken()
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: clientName, phone: clientPhone })
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        console.error('Failed to add client:', res.status, errorData)
        alert(`Failed to add client: ${errorData.error || 'Unknown error'}`)
        return
      }
      
      setClientName('')
      setClientPhone('')
      setShowClientForm(false)
      loadClients()
    } catch (error) {
      console.error('Error adding client:', error)
      alert('Failed to add client. Check console for details.')
    }
  }

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Delete this client?')) return
    try {
      const token = getToken()
      await fetch(`/api/admin/clients/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (selectedClient?.id === id) {
        setSelectedClient(null)
        setDocuments([])
      }
      loadClients()
    } catch (error) {
      console.error('Error deleting client:', error)
    }
  }

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClient || !docFile) return
    
    try {
      setUploading(true)
      const token = getToken()
      const formData = new FormData()
      formData.append('title', docTitle)
      formData.append('file', docFile)
      
      const res = await fetch(`/api/admin/clients/${selectedClient.id}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })
      
      if (res.ok) {
        setDocTitle('')
        setDocFile(null)
        setShowDocForm(false)
        loadDocuments(selectedClient.id)
      }
    } catch (error) {
      console.error('Error adding document:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (docId: string) => {
    if (!selectedClient || !confirm('Delete this document?')) return
    try {
      const token = getToken()
      await fetch(`/api/admin/clients/${selectedClient.id}/documents/${docId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      loadDocuments(selectedClient.id)
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  const handleMigrateDocuments = async () => {
    if (!confirm('Migrate existing documents from Storage to Firestore?')) return
    
    try {
      setMigrating(true)
      const token = getToken()
      const res = await fetch('/api/admin/migrate-documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await res.json()
      
      if (res.ok) {
        alert(`Migration complete! Created: ${data.migrated}, Skipped: ${data.skipped}`)
        if (selectedClient) {
          loadDocuments(selectedClient.id)
        }
      } else {
        alert(`Migration failed: ${data.error}`)
      }
    } catch (error) {
      console.error('Error migrating documents:', error)
      alert('Migration failed')
    } finally {
      setMigrating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">WhatsApp Bot Admin</h1>
          <div className="flex gap-2">
            <button
              onClick={handleMigrateDocuments}
              disabled={migrating}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              {migrating ? 'Migrating...' : 'Migrate Docs'}
            </button>
            <button
              onClick={() => signOut()}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Sign Out
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Clients Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Clients</h2>
              <button
                onClick={() => setShowClientForm(!showClientForm)}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                {showClientForm ? 'Cancel' : 'Add Client'}
              </button>
            </div>

            {showClientForm && (
              <form onSubmit={handleAddClient} className="mb-4 p-4 bg-gray-50 rounded">
                <input
                  type="text"
                  placeholder="Name"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full p-2 border rounded mb-2"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone (e.g., +1234567890)"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full p-2 border rounded mb-2"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
                >
                  Save Client
                </button>
              </form>
            )}

            <div className="space-y-2">
              {clients.map((client) => (
                <div
                  key={client.id}
                  className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                    selectedClient?.id === client.id ? 'bg-blue-50 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedClient(client)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{client.name}</div>
                      <div className="text-sm text-gray-600">{client.phone}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteClient(client.id)
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {clients.length === 0 && (
                <p className="text-gray-500 text-center py-4">No clients yet</p>
              )}
            </div>
          </div>

          {/* Documents Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                Documents {selectedClient && `- ${selectedClient.name}`}
              </h2>
              {selectedClient && (
                <button
                  onClick={() => setShowDocForm(!showDocForm)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  {showDocForm ? 'Cancel' : 'Add Document'}
                </button>
              )}
            </div>

            {!selectedClient && (
              <p className="text-gray-500 text-center py-8">Select a client to view documents</p>
            )}

            {selectedClient && showDocForm && (
              <form onSubmit={handleAddDocument} className="mb-4 p-4 bg-gray-50 rounded">
                <input
                  type="text"
                  placeholder="Document Title"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full p-2 border rounded mb-2"
                  required
                />
                <input
                  type="file"
                  onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border rounded mb-2"
                  required
                />
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:bg-gray-400"
                >
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </button>
              </form>
            )}

            {selectedClient && loading && (
              <p className="text-center py-4">Loading documents...</p>
            )}

            {selectedClient && !loading && (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-3 border rounded">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{doc.title}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {documents.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No documents yet</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
