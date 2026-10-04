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
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#f7f7f4' }, { media: '(prefers-color-scheme: dark)', color: '#171b1e' }],
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
    <html lang="it" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: `try{const t=localStorage.getItem("athena-theme");document.documentElement.dataset.theme=t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches)?"dark":"light"}catch{}` }} /></head>
      <body>
        {children}
        <PwaRegistration />
      </body>
    </html>
  )
}
