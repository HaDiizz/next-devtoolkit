'use client'

import { ArrowRight } from 'lucide-react'

export function RetryButton() {
  return (
    <button
      onClick={() => window.location.reload()}
      className="border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 inline-flex items-center gap-2 rounded-xl border px-8 py-4 text-base font-semibold transition-all hover:scale-105 active:scale-95"
    >
      Try Again
      <ArrowRight className="h-5 w-5" />
    </button>
  )
}
