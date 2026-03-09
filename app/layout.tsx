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
  metadataBase: new URL('https://next-devtoolkit.vercel.app'),
  title: {
    default: 'DevToolkit',
    template: '%s | DevToolkit',
  },
  description:
    'A comprehensive set of developer utilities including UUID generator, JWT decoder, JSON formatter, Base64 converter, password generator, timestamp converter, mock data generator, Thai CID generator and many more tools for developers and programmers.',
  keywords: [
    'dev tools',
    'devtool',
    'dev tools online',
    'devtool online',
    'devtoolkit',
    'dev toolkit',
    'devtools',
    'developer toolkit',
    'next devtool',
    'next devtoolkit',
    'next dev tools',
    'next dev toolkit',
    'next-devtool',
    'next-devtoolkit',
    'next-dev-tool',
    'next-dev-toolkit',

    'developer tools',
    'programmer tools',
    'web developer tools',
    'frontend developer tools',
    'backend developer tools',
    'software developer tools',
    'coding tools',
    'programming utilities',
    'web utilities',
    'online developer tools',

    'uuid generator',
    'uuid v4 generator',
    'cuid generator',
    'random string generator',
    'random number generator',
    'password generator',
    'secure password generator',
    'random data generator',
    'mock data generator',
    'fake data generator',
    'test data generator',

    'timestamp converter',
    'unix timestamp converter',
    'date time converter',
    'base64 encoder',
    'base64 decoder',
    'base64 converter',
    'unit converter',
    'image converter',
    'text converter',
    'data converter',

    'json formatter',
    'json beautifier',
    'json pretty print',
    'json validator',
    'json parser',

    'jwt decoder',
    'jwt parser',
    'jwt token decoder',
    'token decoder',
    'hash generator',
    'crypto tools',

    'nextjs developer tools',
    'nextjs utilities',
    'javascript developer tools',
    'typescript developer tools',
    'nodejs developer tools',
    'api developer tools',

    'api testing tools',
    'developer testing tools',
    'debugging tools',

    'online tools for developers',
    'developer utilities online',
    'free developer tools',
    'modern developer toolkit',

    'เครื่องมือโปรแกรมเมอร์',
    'เครื่องมือพัฒนาซอฟต์แวร์',
    'เครื่องมือสำหรับนักพัฒนา',
    'เครื่องมือ developer',
    'ตัวสร้าง uuid',
    'ตัวแปลง base64',
    'ตัวจัดรูปแบบ json',
    'ตัวแปลง timestamp',
    'ตัวสร้างรหัสผ่าน',
    'ตัวสร้าง mock data',
    'ตัวสร้างข้อมูลทดสอบ',
    'ตัวสร้างเลขบัตรประชาชน',
    'เครื่องมือ json',
    'เครื่องมือแปลงข้อมูล',
    'โปรแกรมเมอร์ไทย',
    'เครื่องมือออนไลน์สำหรับโปรแกรมเมอร์',
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
      'Comprehensive developer utilities including UUID generator, JWT decoder, JSON formatter, Base64 converter, timestamp converter, password generator and many more.',
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
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noarchive: true,
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
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
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
