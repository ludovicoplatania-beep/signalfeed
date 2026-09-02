import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PwaRegistration } from './components/pwa-registration'

export const metadata: Metadata = {
  title: 'SignalFeed — briefing personale',
  description: 'AI curated news intelligence',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: 'SignalFeed',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#050505',
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
