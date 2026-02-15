import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CleanSync - 民泊清掃管理',
  description: '民泊・バケーションレンタルの清掃業務管理アプリケーション',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className="antialiased bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}
