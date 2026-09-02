import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PwaRegistration } from './components/pwa-registration'

export const metadata: Metadata = {
  title: 'Athena — briefing personale',
  description: 'AI curated news intelligence',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'Athena',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#070708',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="it">
      <body>
        {children}
        <PwaRegistration />
      </body>
    </html>
  )
}
