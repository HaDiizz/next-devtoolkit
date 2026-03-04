'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Terminal, ArrowLeft, SearchX } from 'lucide-react'

export default function GlobalNotFound() {
  const router = useRouter()

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="relative mx-auto mb-6 inline-block">
        <div className="from-primary/30 via-primary/10 to-info/30 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br p-1">
          <div className="bg-background flex h-full w-full items-center justify-center rounded-full">
            <SearchX className="text-primary h-10 w-10 animate-pulse" />
          </div>
        </div>
        <span className="bg-primary absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg">
          ?
        </span>
      </div>

      <h1 className="text-foreground mb-3 text-4xl font-extrabold tracking-tight lg:text-5xl">
        404 - Page Not Found
      </h1>
      <p className="text-muted-foreground mb-8 max-w-md text-base leading-relaxed lg:text-lg">
        Sorry, the page you are looking for doesn&apos;t exist or has been moved.
      </p>

      <div className="flex flex-wrap justify-center gap-4">
        <Link
          href="/"
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold transition-all hover:scale-105 active:scale-95"
        >
          <Terminal className="h-5 w-5" />
          Back to Home
        </Link>
        <button
          onClick={() => router.back()}
          className="border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center gap-2 rounded-xl border px-8 py-4 text-base font-semibold transition-all hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" />
          Go Back
        </button>
      </div>

      <p className="text-muted-foreground mt-12 text-sm">
        DevToolkit — Professional Developer Utilities
      </p>
    </div>
  )
}
