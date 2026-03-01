import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'
import Script from 'next/script'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'DevToolkit | Professional Developer Utilities & SDK Tools',
    template: '%s | DevToolkit',
  },
  description:
    'A comprehensive set of developer utilities: UUID/CUID generators, timestamp converter, password generator, JSON formatter, mock data, Thai CID generator, and more. เครื่องมือพัฒนาซอฟต์แวร์ ตัวแปลงรหัส เครื่องมือ JSON โปรแกรมสร้างรหัสผ่าน ตัวแปลงเวลา เครื่องมือโปรแกรมเมอร์ ภาษาไทย จัดการข้อมูล สร้าง Mock Data.',
  keywords: [
    'developer tools',
    'json formatter',
    'jwt decoder',
    'uuid generator',
    'password generator',
    'web utilities',
    'nextjs 16',
    'sdk tools',
    'programmer tools',
    'thai cid generator',
    'unit converter',
    'เครื่องมือพัฒนาซอฟต์แวร์',
    'ตัวแปลงรหัส',
    'เครื่องมือ JSON',
    'โปรแกรมสร้างรหัสผ่าน',
    'ตัวแปลงเวลา',
    'เครื่องมือโปรแกรมเมอร์',
    'ภาษาไทย',
    'จัดการข้อมูล',
    'สร้าง Mock Data',
    'โปรแกรมเมอร์ไทย',
  ],
  authors: [{ name: 'DevToolkit Team' }],
  creator: 'DevToolkit',
  publisher: 'DevToolkit',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'DevToolkit | Professional Developer Utilities & SDK Tools',
    description:
      'Comprehensive set of developer utilities for modern software engineers. Offline-capable, secure, and fast.',
    url: 'https://devtoolkit-plus.vercel.app',
    siteName: 'DevToolkit',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'DevToolkit Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevToolkit | Developer Utilities',
    description: 'Professional Utilities for Modern Developers.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
      {
        url: '/icon-32x32.png',
        type: 'image/png',
        sizes: '32x32',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${_geistMono.className} ${_geist.className} font-sans antialiased`}
        suppressHydrationWarning
      >
        {children}
        <Toaster />
        <Analytics />
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('ServiceWorker registration successful');
                }, function(err) {
                  console.log('ServiceWorker registration failed: ', err);
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}
