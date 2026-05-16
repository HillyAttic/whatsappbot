'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ClientList from '@/components/admin/ClientList'
import ClientForm from '@/components/admin/ClientForm'
import DocumentList from '@/components/admin/DocumentList'
import DocumentForm from '@/components/admin/DocumentForm'
import ConfirmDialog from '@/components/admin/ConfirmDialog'
import CategoryManager from '@/components/admin/CategoryManager'
import { CATEGORY_NAMES, CATEGORIES } from '@/lib/document-categories'

interface Client {
  id: string
  name: string
  phones: string[]
  gstNumber?: string
}

interface Document {
  id: string
  title: string
  filePath: string
  uploadedAt?: string
  category?: string
  fiscalYear?: string | null
  subCategory?: string | null
}

type ModalMode = 'create' | 'edit' | null

export default function AdminPage() {
  const { user, signOut, getToken } = useAuth()

  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingDocs, setLoadingDocs] = useState(false)

  const [clientModal, setClientModal] = useState<ModalMode>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [deletingClient, setDeletingClient] = useState<Client | null>(null)
  const [creatingClient, setCreatingClient] = useState(false)
  const [updatingClient, setUpdatingClient] = useState(false)
  const [isDeletingClient, setIsDeletingClient] = useState(false)

  const [categories, setCategories] = useState<Record<string, { fiscalYears: string[]; subCategories: string[] }>>(CATEGORIES)
  const [categoryModal, setCategoryModal] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)

  const [docModal, setDocModal] = useState<ModalMode>(null)
  const [editingDoc, setEditingDoc] = useState<Document | null>(null)
  const [deletingDoc, setDeletingDoc] = useState<Document | null>(null)
  const [isDeletingDoc, setIsDeletingDoc] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [uploadPreset, setUploadPreset] = useState<{ category: string; fiscalYear: string | null; subCategory: string | null } | null>(null)

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => { loadClients(); loadCategories() }, [])

  useEffect(() => {
    if (selectedClient) { loadDocuments(selectedClient.id) }
    else { setDocuments([]) }
  }, [selectedClient])

  const authHeaders = () => {
    const token = getToken()
    return { 'Authorization': 'Bearer ' + token }
  }

  const loadClients = async () => {
    try {
      setLoadingClients(true)
      const res = await fetch('/api/admin/clients', { headers: authHeaders() })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      // Handle backward compatibility: convert old phone format to phones array
      const normalizedClients = (Array.isArray(data) ? data : []).map((client: any) => ({
        ...client,
        phones: client.phones || (client.phone ? [client.phone] : [])
      }))
      setClients(normalizedClients)
    } catch (error) {
      showToast('Failed to load clients', 'error')
    } finally {
      setLoadingClients(false)
    }
  }

  const loadCategories = async () => {
    try {
      setLoadingCategories(true)
      const res = await fetch('/api/admin/categories', { headers: authHeaders() })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      if (data.categories && Object.keys(data.categories).length > 0) {
        setCategories(data.categories)
      } else {
        await fetch('/api/admin/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({ categories: CATEGORIES }),
        })
      }
    } catch (error) {
      console.error('Failed to load categories', error)
    } finally {
      setLoadingCategories(false)
    }
  }

  const handleSaveCategories = async (newCategories: Record<string, { fiscalYears: string[]; subCategories: string[] }>) => {
    try {
      setLoadingCategories(true)
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ categories: newCategories }),
      })
      if (!res.ok) throw new Error('Failed')
      setCategories(newCategories)
      setCategoryModal(false)
      showToast('Categories updated successfully')
    } catch (error) {
      showToast('Failed to save categories', 'error')
    } finally {
      setLoadingCategories(false)
    }
  }

  const loadDocuments = async (clientId: string) => {
    try {
      setLoadingDocs(true)
      const res = await fetch('/api/admin/clients/' + clientId + '/documents', { headers: authHeaders() })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setDocuments(data)
    } catch (error) {
      showToast('Failed to load documents', 'error')
    } finally {
      setLoadingDocs(false)
    }
  }

  const handleCreateClient = async (data: { name: string; phones: string[]; gstNumber?: string }) => {
    try {
      setCreatingClient(true)
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed')
      }
      setClientModal(null)
      await loadClients()
      showToast('Client created successfully')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to create client', 'error')
    } finally {
      setCreatingClient(false)
    }
  }

  const handleUpdateClient = async (data: { name: string; phones: string[]; gstNumber?: string }) => {
    if (!editingClient) return
    try {
      setUpdatingClient(true)
      const res = await fetch('/api/admin/clients/' + editingClient.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed')
      }
      setEditingClient(null)
      setClientModal(null)
      await loadClients()
      if (selectedClient?.id === editingClient.id) {
        setSelectedClient({ ...editingClient, ...data })
      }
      showToast('Client updated successfully')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update client', 'error')
    } finally {
      setUpdatingClient(false)
    }
  }

  const handleDeleteClient = async () => {
    if (!deletingClient) return
    setIsDeletingClient(true)
    try {
      await fetch('/api/admin/clients/' + deletingClient.id, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      if (selectedClient?.id === deletingClient.id) { setSelectedClient(null) }
      setDeletingClient(null)
      await loadClients()
      showToast('Client deleted successfully')
    } catch (error) {
      showToast('Failed to delete client', 'error')
    } finally {
      setIsDeletingClient(false)
    }
  }

  const uploadFileViaSignedUrl = async (file: File, filePath: string): Promise<void> => {
    const urlRes = await fetch('/api/admin/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ filePath, contentType: file.type }),
    })
    if (!urlRes.ok) throw new Error('Failed to get upload URL')
    const { url } = await urlRes.json()
    const uploadRes = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!uploadRes.ok) throw new Error('Failed to upload file to storage')
  }

  const handleCreateDocument = async (data: { title: string; file: File | null; files: File[]; category: string; fiscalYear: string | null; subCategory: string | null }) => {
    if (!selectedClient) return
    const filesToUpload = data.files.length > 0 ? data.files : data.file ? [data.file] : []
    if (filesToUpload.length === 0) return
    const isMulti = filesToUpload.length > 1
    try {
      setUploading(true)
      let failed = 0
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i]
        if (isMulti) setUploadProgress(`Uploading ${i + 1} of ${filesToUpload.length}...`)
        const fileTitle = isMulti ? file.name.replace(/\.[^/.]+$/, '') : data.title

        const pathParts = ['JPCO Client Documents', selectedClient.name, data.category]
        if (data.fiscalYear) pathParts.push(data.fiscalYear)
        if (data.subCategory) pathParts.push(data.subCategory)
        pathParts.push(file.name)
        const filePath = pathParts.join('/')

        try {
          await uploadFileViaSignedUrl(file, filePath)
          const res = await fetch('/api/admin/clients/' + selectedClient.id + '/documents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders() },
            body: JSON.stringify({
              title: fileTitle,
              filePath,
              category: data.category,
              fiscalYear: data.fiscalYear,
              subCategory: data.subCategory,
            }),
          })
          if (!res.ok) failed++
        } catch {
          failed++
        }
      }
      setDocModal(null)
      setUploadPreset(null)
      await loadDocuments(selectedClient.id)
      if (failed > 0) {
        showToast(`${filesToUpload.length - failed} uploaded, ${failed} failed`, 'error')
      } else {
        showToast(isMulti ? `${filesToUpload.length} documents uploaded` : 'Document uploaded')
      }
    } catch (error) {
      showToast('Failed to upload documents', 'error')
    } finally {
      setUploading(false)
      setUploadProgress('')
    }
  }

  const handleUpdateDocument = async (data: { title: string; file: File | null; category: string; fiscalYear: string | null; subCategory: string | null }) => {
    if (!selectedClient || !editingDoc) return
    try {
      setUploading(true)
      let newFilePath: string | undefined
      if (data.file) {
        const pathParts = ['JPCO Client Documents', selectedClient.name, data.category]
        if (data.fiscalYear) pathParts.push(data.fiscalYear)
        if (data.subCategory) pathParts.push(data.subCategory)
        pathParts.push(data.file.name)
        newFilePath = pathParts.join('/')
        await uploadFileViaSignedUrl(data.file, newFilePath)
      }
      
      console.log('Sending PUT request with data:', {
        title: data.title,
        filePath: newFilePath,
        category: data.category,
        fiscalYear: data.fiscalYear,
        subCategory: data.subCategory,
      })
      
      const res = await fetch('/api/admin/clients/' + selectedClient.id + '/documents/' + editingDoc.id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          title: data.title,
          filePath: newFilePath,
          category: data.category,
          fiscalYear: data.fiscalYear,
          subCategory: data.subCategory,
        }),
      })
      
      if (!res.ok) {
        const errorData = await res.json()
        console.error('Update failed:', errorData)
        throw new Error(errorData.error || 'Failed')
      }
      
      setEditingDoc(null)
      setDocModal(null)
      await loadDocuments(selectedClient.id)
      showToast('Document updated')
    } catch (error) {
      console.error('Error updating document:', error)
      showToast(error instanceof Error ? error.message : 'Failed to update document', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async () => {
    if (!selectedClient || !deletingDoc) return
    setIsDeletingDoc(true)
    try {
      await fetch('/api/admin/clients/' + selectedClient.id + '/documents/' + deletingDoc.id, {
        method: 'DELETE',
        headers: authHeaders(),
      })
      setDeletingDoc(null)
      await loadDocuments(selectedClient.id)
      showToast('Document deleted successfully')
    } catch (error) {
      showToast('Failed to delete document', 'error')
    } finally {
      setIsDeletingDoc(false)
    }
  }

  return (
    <div className="h-screen flex overflow-hidden bg-surface relative">
      {/* Subtle grain overlay on the whole admin area */}
      <div className="absolute inset-0 diagonal-stripes pointer-events-none z-0" />

      {/* Sidebar — deep charcoal, sharp edges */}
      <aside className="w-80 flex-shrink-0 bg-sidebar flex flex-col shadow-sidebar z-10 relative">
        {/* Sidebar header */}
        <div className="px-6 py-5 border-b-2 border-sidebar-border relative">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-none bg-ink flex items-center justify-center">
                <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-accent" />
            </div>
            <div>
              <h1 className="text-ink-inverse text-lg font-display font-bold tracking-tight leading-none">JPCO<span className="text-accent">.</span></h1>
              <p className="text-ink-muted text-[10px] font-mono uppercase tracking-widest mt-0.5">Admin Dashboard</p>
            </div>
          </div>
        </div>

        {/* Sidebar toolbar */}
        <div className="px-6 pt-4 pb-2 flex items-center justify-between">
          <span className="eyebrow text-ink-muted">Clients</span>
          <div className="flex gap-1">
            <button
              onClick={() => setCategoryModal(true)}
              className="w-8 h-8 flex items-center justify-center rounded-none bg-accent/15 hover:bg-accent/25 text-accent-light transition-colors border border-accent/20 hover:border-accent/40"
              title="Manage categories"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
              </svg>
            </button>
            <button
              onClick={() => { setEditingClient(null); setClientModal('create') }}
              className="w-8 h-8 flex items-center justify-center rounded-none bg-accent/15 hover:bg-accent/25 text-accent-light transition-colors border border-accent/20 hover:border-accent/40"
              title="Add client"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </button>
          </div>
        </div>

        {/* Client list area */}
        <div className="flex-1 overflow-y-auto py-1 px-3 min-h-0">
          {loadingClients ? (
            <div className="px-3 py-8 space-y-3">
              {[0,1,2].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse-soft">
                  <div className="w-10 h-10 rounded-none bg-sidebar-hover" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-sidebar-hover w-3/4" />
                    <div className="h-2 bg-sidebar-hover w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ClientList
              clients={clients}
              selectedClientId={selectedClient?.id || null}
              onSelect={setSelectedClient}
              onEdit={(client) => { setEditingClient(client); setClientModal('edit') }}
              onDelete={setDeletingClient}
            />
          )}
        </div>

        {/* Sidebar footer — user info */}
        <div className="px-6 py-4 border-t-2 border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-none bg-accent/20 flex items-center justify-center border border-accent/30">
                <span className="text-accent-light text-xs font-bold">{user?.email?.[0]?.toUpperCase() || 'A'}</span>
              </div>
              <span className="text-xs text-ink-muted truncate max-w-[140px] font-mono">{user?.email}</span>
            </div>
            <button
              onClick={signOut}
              className="w-8 h-8 flex items-center justify-center rounded-none hover:bg-sidebar-hover text-ink-muted hover:text-danger transition-colors border border-transparent hover:border-danger/30"
              title="Sign out"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-h-0 z-10">
        {selectedClient ? (
          <div className="flex-1 flex flex-col min-h-0 animate-panel-in">
            {/* Header — sharp, editorial style */}
            <header className="px-8 py-5 border-b-2 border-ink/10 bg-white/80 backdrop-blur-sm flex-shrink-0 relative">
              {/* Accent bar */}
              <div className="absolute top-0 left-0 w-24 h-1 bg-accent" />
              <div className="flex items-center justify-between">
                <div>
                  <span className="eyebrow text-ink-muted">Managing Documents For</span>
                  <div className="flex items-center gap-3 mt-1">
                    <h2 className="text-2xl font-display font-bold text-ink tracking-tight leading-none">{selectedClient.name}</h2>
                    <span className="inline-flex items-center px-2 py-0.5 bg-teal-light text-teal text-[10px] font-bold uppercase tracking-wider rounded-none border border-teal/20">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted font-mono mt-1">{selectedClient.phones[0]}</p>
                </div>
                <button
                  onClick={() => { setEditingDoc(null); setDocModal('create') }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white text-xs font-bold uppercase tracking-wider rounded-none hover:bg-accent-hover transition-colors shadow-bold hover:shadow-glow-accent"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Upload Document
                </button>
              </div>
            </header>

            {/* Document list */}
            <div className="flex-1 overflow-y-auto p-8 min-h-0">
              {loadingDocs ? (
                <div className="space-y-3">
                  {[0,1,2,3].map((i) => (
                    <div key={i} className="h-14 bg-white border-2 border-ink/5 rounded-none animate-pulse-soft" />
                  ))}
                </div>
              ) : (
                <DocumentList
                  documents={documents}
                  onEdit={(doc) => { setEditingDoc(doc); setUploadPreset(null); setDocModal('edit') }}
                  onDelete={setDeletingDoc}
                  onUpload={(preset) => { setEditingDoc(null); setUploadPreset(preset); setDocModal('create') }}
                  getAuthToken={getToken}
                  categoryConfig={categories}
                />
              )}
            </div>
          </div>
        ) : (
          /* Empty state — bold, inviting */
          <div className="flex-1 flex items-center justify-center relative">
            <div className="text-center animate-fade-in max-w-sm">
              <div className="relative inline-block mb-8">
                <div className="w-28 h-28 rounded-none bg-white border-2 border-ink/10 flex items-center justify-center shadow-bold">
                  <svg className="w-14 h-14 text-ink-muted/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                </div>
                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-accent rotate-12" />
              </div>
              <span className="eyebrow mb-3 block">Client Management</span>
              <h3 className="text-2xl font-display font-bold text-ink mb-3 leading-tight">Select a Client</h3>
              <p className="text-sm text-ink-muted leading-relaxed">Choose a client from the sidebar to view and manage their documents</p>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {clientModal && (
        <div className="fixed inset-0 bg-ink/50 modal-backdrop flex items-center justify-center z-50 animate-fade-in" onClick={() => { setClientModal(null); setEditingClient(null) }}>
          <div className="bg-white border-2 border-ink/10 shadow-modal animate-scale-in max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b-2 border-ink/10 flex items-center justify-between">
              <h3 className="text-lg font-display font-bold text-ink">{clientModal === 'create' ? 'New Client' : 'Edit Client'}</h3>
              <button onClick={() => { setClientModal(null); setEditingClient(null) }} className="w-8 h-8 flex items-center justify-center rounded-none hover:bg-surface-hover text-ink-muted hover:text-ink transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6">
              <ClientForm
                initial={editingClient || undefined}
                onSubmit={clientModal === 'create' ? handleCreateClient : handleUpdateClient}
                onCancel={() => { setClientModal(null); setEditingClient(null) }}
                loading={clientModal === 'create' ? creatingClient : updatingClient}
              />
            </div>
          </div>
        </div>
      )}

      {categoryModal && (
        <div className="fixed inset-0 bg-ink/50 modal-backdrop flex items-center justify-center z-50 animate-fade-in" onClick={() => setCategoryModal(false)}>
          <div className="bg-white border-2 border-ink/10 shadow-modal animate-scale-in max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b-2 border-ink/10 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-lg font-display font-bold text-ink">Manage Categories</h3>
              <button onClick={() => setCategoryModal(false)} className="w-8 h-8 flex items-center justify-center rounded-none hover:bg-surface-hover text-ink-muted hover:text-ink transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6">
              <CategoryManager
                categories={categories}
                onSave={handleSaveCategories}
                onCancel={() => setCategoryModal(false)}
                loading={loadingCategories}
              />
            </div>
          </div>
        </div>
      )}

      {docModal && (
        <div className="fixed inset-0 bg-ink/50 modal-backdrop flex items-center justify-center z-50 animate-fade-in" onClick={() => { setDocModal(null); setEditingDoc(null); setUploadPreset(null) }}>
          <div className="bg-white border-2 border-ink/10 shadow-modal animate-scale-in max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b-2 border-ink/10 flex items-center justify-between">
              <h3 className="text-lg font-display font-bold text-ink">{docModal === 'create' ? 'Upload Document' : 'Edit Document'}</h3>
              <button onClick={() => { setDocModal(null); setEditingDoc(null); setUploadPreset(null) }} className="w-8 h-8 flex items-center justify-center rounded-none hover:bg-surface-hover text-ink-muted hover:text-ink transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6">
              {uploading ? (
                <div className="py-12 text-center">
                  <div className="animate-spin rounded-none h-10 w-10 border-2 border-accent border-t-transparent mx-auto mb-4" />
                  <p className="text-sm text-ink-muted font-medium">{uploadProgress || 'Uploading...'}</p>
                </div>
              ) : (
                <DocumentForm
                  initial={editingDoc || undefined}
                  preset={docModal === 'create' ? (uploadPreset || undefined) : undefined}
                  onSubmit={docModal === 'create' ? handleCreateDocument : handleUpdateDocument}
                  onCancel={() => { setDocModal(null); setEditingDoc(null); setUploadPreset(null) }}
                  categoryConfig={categories}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {deletingClient && (
        <ConfirmDialog
          message={`Delete "${deletingClient.name}" and all their documents? This cannot be undone.`}
          onConfirm={handleDeleteClient}
          onCancel={() => setDeletingClient(null)}
          loading={isDeletingClient}
        />
      )}
      {deletingDoc && (
        <ConfirmDialog
          message={`Delete "${deletingDoc.title}"? This cannot be undone.`}
          onConfirm={handleDeleteDocument}
          onCancel={() => setDeletingDoc(null)}
          loading={isDeletingDoc}
        />
      )}

      {/* Toast notifications */}
      {toast && (
        <div className="fixed top-5 right-5 z-[60] toast-enter">
          <div className={`flex items-center gap-2.5 px-5 py-3 rounded-none shadow-bold text-sm font-medium border-2 ${
            toast.type === 'success'
              ? 'bg-ink text-white border-ink'
              : 'bg-danger text-white border-danger'
          }`}>
            {toast.type === 'success' ? (
              <svg className="w-4 h-4 flex-shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  )
}
