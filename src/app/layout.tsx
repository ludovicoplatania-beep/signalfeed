import type { Metadata, Viewport } from 'next'
import './reading.css'
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
    icon: [
      { url: '/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#141413',
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
    <html lang="it" data-theme="dark" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: `try{const t=localStorage.getItem("athena-theme");document.documentElement.dataset.theme=t==="light"?"light":"dark"}catch{}` }} /></head>
      <body>
        {children}
        <PwaRegistration />
      </body>
    </html>
  )
}
