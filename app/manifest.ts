import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'JPCO WhatsApp Bot Admin Panel',
    short_name: 'JPCO Admin',
    description: 'Admin panel for WhatsApp document retrieval system',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#7c3aed',
    icons: [
      {
        src: '/registration_karo_logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/registration_karo_logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
