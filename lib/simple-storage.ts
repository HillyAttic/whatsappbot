import fs from 'fs'
import path from 'path'

// Simple in-memory database (in production, use a real database)
interface Client {
  id: string
  name: string
  phone: string
}

interface Document {
  id: string
  phone: string
  title: string
  filePath: string
  uploadedAt: string
}

let clients: Client[] = []
let documents: Document[] = []
let clientIdCounter = 1
let documentIdCounter = 1

// Storage directory for uploaded files
const STORAGE_DIR = path.join(process.cwd(), 'storage')

// Ensure storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
  fs.mkdirSync(STORAGE_DIR, { recursive: true })
}

// Client operations
export const clientStorage = {
  async getAll(): Promise<Client[]> {
    return clients
  },

  async getById(id: string): Promise<Client | null> {
    return clients.find(c => c.id === id) || null
  },

  async create(data: { name: string; phone: string }): Promise<Client> {
    const client: Client = {
      id: String(clientIdCounter++),
      name: data.name,
      phone: data.phone,
    }
    clients.push(client)
    return client
  },

  async update(id: string, data: { name: string; phone: string }): Promise<Client | null> {
    const index = clients.findIndex(c => c.id === id)
    if (index === -1) return null
    
    clients[index] = {
      ...clients[index],
      name: data.name,
      phone: data.phone,
    }
    return clients[index]
  },

  async delete(id: string): Promise<boolean> {
    const index = clients.findIndex(c => c.id === id)
    if (index === -1) return false
    
    clients.splice(index, 1)
    return true
  },
}

// Document operations
export const documentStorage = {
  async getByPhone(phone: string): Promise<Document[]> {
    return documents.filter(d => d.phone === phone)
  },

  async getById(id: string): Promise<Document | null> {
    return documents.find(d => d.id === id) || null
  },

  async create(data: { phone: string; title: string; filePath: string }): Promise<Document> {
    const document: Document = {
      id: String(documentIdCounter++),
      phone: data.phone,
      title: data.title,
      filePath: data.filePath,
      uploadedAt: new Date().toISOString(),
    }
    documents.push(document)
    return document
  },

  async update(id: string, data: { title: string; filePath: string }): Promise<Document | null> {
    const index = documents.findIndex(d => d.id === id)
    if (index === -1) return null
    
    documents[index] = {
      ...documents[index],
      title: data.title,
      filePath: data.filePath,
    }
    return documents[index]
  },

  async delete(id: string): Promise<boolean> {
    const index = documents.findIndex(d => d.id === id)
    if (index === -1) return false
    
    documents.splice(index, 1)
    return true
  },

  async deleteByPhone(phone: string): Promise<number> {
    const initialLength = documents.length
    documents = documents.filter(d => d.phone !== phone)
    return initialLength - documents.length
  },
}

// File storage operations
export const fileStorage = {
  async upload(phone: string, fileBuffer: Buffer, filename: string): Promise<string> {
    const userDir = path.join(STORAGE_DIR, phone)
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true })
    }

    const filePath = path.join(userDir, filename)
    fs.writeFileSync(filePath, fileBuffer)
    
    return `${phone}/${filename}`
  },

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(STORAGE_DIR, filePath)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
    }
  },

  getFullPath(filePath: string): string {
    return path.join(STORAGE_DIR, filePath)
  },
}

// Helper functions for webhook
export function getAllClients(): Client[] {
  return clients
}

export function parseWebhookPayload(body: any): { from: string; text: string } | null {
  try {
    const entry = body?.entry?.[0]
    const change = entry?.changes?.[0]
    const message = change?.value?.messages?.[0]

    if (!message || message.type !== 'text') {
      return null
    }

    return {
      from: message.from,
      text: message.text.body,
    }
  } catch {
    return null
  }
}

export function sanitizeMessageBody(text: string): string {
  return text.trim()
}

export async function findUser(phone: string): Promise<Client | null> {
  return clients.find(c => c.phone === phone) || null
}

export async function getDocuments(phone: string): Promise<Document[]> {
  return documents.filter(d => d.phone === phone)
}

// Session storage for document selection
const sessions = new Map<string, Document[]>()

export function storeSession(phone: string, docs: Document[]): void {
  sessions.set(phone, docs)
}

export function getSession(phone: string): Document[] | null {
  return sessions.get(phone) || null
}

export async function generateSignedUrl(filePath: string): Promise<string> {
  // In production, generate a signed URL with expiration
  // For now, return a simple URL path
  const fullPath = fileStorage.getFullPath(filePath)
  
  if (!fs.existsSync(fullPath)) {
    throw new Error('File not found')
  }
  
  // Return a URL that can be used to download the file
  // In production, this should be a proper signed URL
  return `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/files/${encodeURIComponent(filePath)}`
}
