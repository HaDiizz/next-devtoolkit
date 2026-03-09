'use client'

import { ReactNode, useState } from 'react'
import { Copy, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCopyToClipboard } from '@/hooks/use-copy'
import { FavoriteToggle } from '@/components/favorite-toggle'

export function ToolLayout({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 text-primary flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-foreground text-2xl font-bold tracking-tight">{title}</h2>
            <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          </div>
        </div>
        <FavoriteToggle />
      </div>
      {children}
    </div>
  )
}

export function OutputBox({
  value,
  label,
  mono = true,
}: {
  value: string
  label?: string
  mono?: boolean
}) {
  const copy = useCopyToClipboard()
  const [copied, setCopied] = useState(false)
  return (
    <div className="group relative">
      {label && <p className="text-muted-foreground mb-1.5 text-xs font-medium">{label}</p>}
      <div className="border-border bg-secondary/50 flex items-center gap-2 rounded-lg border px-4 py-3">
        <span
          className={`text-foreground flex-1 truncate text-sm ${mono ? 'font-mono' : 'font-sans'}`}
        >
          {value || '—'}
        </span>
        <Button
          variant="outline"
          size="icon"
          className="border-border bg-secondary/50 text-muted-foreground flex h-9 w-9 items-center justify-center p-0 hover:text-white"
          onClick={() => {
            void copy(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
          disabled={!value}
        >
          {copied ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span className="sr-only">Copy</span>
        </Button>
      </div>
    </div>
  )
}

export function OutputArea({
  value,
  label,
  rows = 8,
}: {
  value: string
  label?: string
  rows?: number
}) {
  const copy = useCopyToClipboard()
  const [copied, setCopied] = useState(false)
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        {label && <p className="text-muted-foreground text-xs font-medium">{label}</p>}
        <Button
          variant="outline"
          size="sm"
          className="border-border bg-secondary/50 text-muted-foreground flex h-9 items-center justify-center gap-1.5 p-0 hover:text-white sm:w-auto sm:px-3"
          onClick={() => {
            void copy(value)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }}
          disabled={!value}
        >
          {copied ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
        </Button>
      </div>
      <textarea
        readOnly
        value={value}
        rows={rows}
        className="border-border bg-secondary/50 text-foreground w-full resize-none rounded-lg border px-4 py-3 font-mono text-sm focus:outline-none"
      />
    </div>
  )
}
