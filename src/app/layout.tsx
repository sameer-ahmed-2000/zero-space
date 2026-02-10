import { GoogleOAuthProvider } from '@react-oauth/google'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Zero-Space - WYSIWYG Markdown Editor',
  description: 'A high-performance Zero-Space WYSIWYG Markdown editor with instant transformation, file imports, and professional PDF export.',
  keywords: ['zero-space', 'markdown', 'editor', 'wysiwyg', 'tiptap'],
  authors: [{ name: 'Zero-Space Team' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={inter.className}>
        {clientId ? (
          <GoogleOAuthProvider clientId={clientId}>
            {children}
          </GoogleOAuthProvider>
        ) : (
          children
        )}
      </body>
    </html>
  )
}
