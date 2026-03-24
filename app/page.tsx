import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          WhatsApp Document Retrieval Bot
        </h1>
        <p className="text-gray-600 mb-6">
          Admin panel for managing clients and their documents.
        </p>
        <Link
          href="/admin/clients"
          className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Admin Panel
        </Link>
      </div>
    </div>
  )
}
