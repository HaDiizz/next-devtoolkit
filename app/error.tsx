'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="bg-background flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="relative mx-auto mb-6 inline-block">
        <div className="from-destructive/30 via-destructive/10 to-info/30 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br p-1">
          <div className="bg-background flex h-full w-full items-center justify-center rounded-full">
            <AlertTriangle className="text-destructive h-10 w-10 animate-pulse" />
          </div>
        </div>
        <span className="bg-destructive absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg">
          !
        </span>
      </div>

      <h1 className="text-foreground mb-3 text-4xl font-extrabold tracking-tight lg:text-5xl">
        Something went wrong
      </h1>
      <p className="text-muted-foreground mb-8 max-w-md text-base leading-relaxed lg:text-lg">
        An unexpected error occurred. Please try again or head back home.
      </p>

      {error.digest && (
        <p className="text-muted-foreground bg-muted mx-auto mb-8 max-w-xs rounded-lg px-4 py-2 font-mono text-xs">
          Error ID: {error.digest}
        </p>
      )}

      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={reset}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-8 py-4 text-base font-semibold transition-all hover:scale-105 active:scale-95"
        >
          <RotateCcw className="h-5 w-5" />
          Try Again
        </button>
        <Link
          href="/"
          className="border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center gap-2 rounded-xl border px-8 py-4 text-base font-semibold transition-all hover:scale-105 active:scale-95"
        >
          <Home className="h-5 w-5" />
          Back to Home
        </Link>
      </div>

      <p className="text-muted-foreground mt-12 text-sm">
        DevToolkit — Professional Developer Utilities
      </p>
    </div>
  )
}
