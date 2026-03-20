import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SHINE Salon EMR',
    short_name: 'SHINE',
    description: '脱毛サロン向け 電子カルテ＆店舗管理システム',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0D9488', // Teal-600
    icons: [
      {
        src: '/icon.jpg',
        sizes: '1024x1024',
        type: 'image/jpeg',
      },
      {
        src: '/icon.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
      {
        src: '/icon.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
    ],
  }
}
