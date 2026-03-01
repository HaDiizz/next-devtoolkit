'use client'

import { useState, useCallback } from 'react'
import { Fingerprint } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ToolLayout, OutputBox } from '@/components/tool-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function cuid(): string {
  const ts = Date.now().toString(36)
  const rand = () => Math.random().toString(36).slice(2, 8)
  return `c${ts}${rand()}${rand()}`
}

function nanoid(size = 21): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'
  let id = ''
  const values = crypto.getRandomValues(new Uint8Array(size))
  for (let i = 0; i < size; i++) {
    id += chars[values[i] & 63]
  }
  return id
}

function ulid(): string {
  const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
  const TIME_LEN = 10
  const RANDOM_LEN = 16
  let time = Date.now()
  let timeStr = ''
  for (let i = TIME_LEN; i > 0; i--) {
    timeStr = ENCODING[time % 32] + timeStr
    time = Math.floor(time / 32)
  }
  let randomStr = ''
  const values = crypto.getRandomValues(new Uint8Array(RANDOM_LEN))
  for (let i = 0; i < RANDOM_LEN; i++) {
    randomStr += ENCODING[values[i] % 32]
  }
  return timeStr + randomStr
}

function objectId(): string {
  const ts = Math.floor(Date.now() / 1000)
    .toString(16)
    .padStart(8, '0')
  const rand = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return ts + rand
}

type IdType = 'uuid' | 'cuid' | 'nanoid' | 'ulid' | 'objectid'

const generators: Record<
  IdType,
  { label: string; description: string; generate: (count: number) => string[] }
> = {
  uuid: {
    label: 'UUID v4',
    description: 'Universally unique identifier (128-bit, RFC 4122)',
    generate: (n) => Array.from({ length: n }, uuidv4),
  },
  cuid: {
    label: 'CUID',
    description: 'Collision-resistant unique identifier for distributed systems',
    generate: (n) => Array.from({ length: n }, cuid),
  },
  nanoid: {
    label: 'NanoID',
    description: 'Compact, URL-friendly unique string ID (21 chars)',
    generate: (n) => Array.from({ length: n }, () => nanoid()),
  },
  ulid: {
    label: 'ULID',
    description: 'Universally Unique Lexicographically Sortable Identifier',
    generate: (n) => Array.from({ length: n }, ulid),
  },
  objectid: {
    label: 'ObjectId',
    description: 'MongoDB-style 24-character hex object identifier',
    generate: (n) => Array.from({ length: n }, objectId),
  },
}

export default function UuidGeneratorTool() {
  const [tab, setTab] = useState<IdType>('uuid')
  const [count, setCount] = useState(1)
  const [results, setResults] = useState<string[]>([])

  const generate = useCallback(() => {
    setResults(generators[tab].generate(Math.min(count, 50)))
  }, [tab, count])

  return (
    <ToolLayout
      title="ID Generator"
      description="Generate unique identifiers in multiple formats"
      icon={Fingerprint}
    >
      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v as IdType)
          setResults([])
        }}
      >
        <TabsList className="bg-secondary flex h-auto flex-wrap">
          {(Object.keys(generators) as IdType[]).map((key) => (
            <TabsTrigger
              key={key}
              value={key}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {generators[key].label}
            </TabsTrigger>
          ))}
        </TabsList>

        {(Object.keys(generators) as IdType[]).map((key) => (
          <TabsContent key={key} value={key} className="mt-4">
            <p className="text-muted-foreground mb-4 text-sm">{generators[key].description}</p>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex items-end gap-3">
        <div className="w-32">
          <Label htmlFor="count" className="text-muted-foreground text-xs">
            Count (max 50)
          </Label>
          <Input
            id="count"
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(50, Number(e.target.value))))}
            className="bg-secondary border-border text-foreground mt-1"
          />
        </div>
        <Button
          onClick={generate}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Generate
        </Button>
      </div>

      {results.length > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          {results.map((r, i) => (
            <OutputBox key={i} value={r} label={results.length > 1 ? `#${i + 1}` : undefined} />
          ))}
        </div>
      )}
    </ToolLayout>
  )
}
