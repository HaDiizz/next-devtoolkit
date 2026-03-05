import type { Metadata, Viewport } from 'next'
import {
  Geist,
  Geist_Mono,
  EB_Garamond,
  Inter,
  Roboto,
  Playfair_Display,
  Montserrat,
  Open_Sans,
  Poppins,
  Lora,
  Oswald,
} from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Toaster } from '@/components/ui/sonner'
import { ThemeProvider } from '@/components/theme-provider'
import { FontProvider } from '@/components/font-provider'
import RegisterSW from '@/components/register-sw'
import './globals.css'

const _geist = Geist({ subsets: ['latin'], variable: '--font-sans' })
const _geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })
const _ebGaramond = EB_Garamond({ subsets: ['latin'], variable: '--font-serif' })
const _inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const _roboto = Roboto({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-roboto' })
const _playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })
const _montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' })
const _openSans = Open_Sans({ subsets: ['latin'], variable: '--font-open-sans' })
const _poppins = Poppins({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-poppins' })
const _lora = Lora({ subsets: ['latin'], variable: '--font-lora' })
const _oswald = Oswald({ subsets: ['latin'], variable: '--font-oswald' })

export const metadata: Metadata = {
  title: {
    default: 'DevToolkit',
    template: '%s | DevToolkit',
  },
  description:
    'A comprehensive set of developer utilities: UUID/CUID generators, timestamp converter, password generator, JSON formatter, mock data, Thai CID generator, and more. เครื่องมือพัฒนาซอฟต์แวร์ ตัวแปลงรหัส เครื่องมือ JSON โปรแกรมสร้างรหัสผ่าน ตัวแปลงเวลา เครื่องมือโปรแกรมเมอร์ ภาษาไทย จัดการข้อมูล สร้าง Mock Data.',
  keywords: [
    'devtool',
    'devtoolkit',
    'next-devtool',
    'next-devtoolkit',
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
    'base64 converter',
    'random data generator',
    'timestamp converter',
    'image converter',
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
  authors: [{ name: 'DevMe Team' }],
  creator: 'nattapol-sh',
  publisher: 'DevMe',
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
    url: 'https://next-devtoolkit.vercel.app',
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
  verification: {
    google: 'WvdrIDson5RmCJVjOZ9EIeAFupaWff_9-BG-r3yknnk',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${_geistMono.variable} ${_geist.variable} ${_ebGaramond.variable} ${_inter.variable} ${_roboto.variable} ${_playfair.variable} ${_montserrat.variable} ${_openSans.variable} ${_poppins.variable} ${_lora.variable} ${_oswald.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <RegisterSW />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <FontProvider>
            {children}
            <Toaster />
            <Analytics />
            <SpeedInsights />
          </FontProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
