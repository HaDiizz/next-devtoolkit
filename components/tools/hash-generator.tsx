'use client'

import { useState } from 'react'
import { Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ToolLayout, OutputBox } from '@/components/tool-layout'

async function hashText(text: string, algorithm: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest(algorithm, data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

const algorithms = [
  { label: 'SHA-1', value: 'SHA-1' },
  { label: 'SHA-256', value: 'SHA-256' },
  { label: 'SHA-384', value: 'SHA-384' },
  { label: 'SHA-512', value: 'SHA-512' },
]

export default function HashGeneratorTool() {
  const [input, setInput] = useState('')
  const [results, setResults] = useState<Record<string, string>>({})

  const generate = async () => {
    if (!input) return
    const hashes: Record<string, string> = {}
    for (const algo of algorithms) {
      hashes[algo.label] = await hashText(input, algo.value)
    }
    setResults(hashes)
  }

  return (
    <ToolLayout
      title="Hash Generator"
      description="Generate cryptographic hashes from text using SHA-1, SHA-256, SHA-384, SHA-512"
      icon={Shield}
    >
      <div>
        <Label className="text-muted-foreground text-xs">Input Text</Label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          placeholder="Enter text to hash..."
          className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-ring mt-1 w-full resize-none rounded-lg border px-4 py-3 text-sm focus:ring-1 focus:outline-none"
        />
      </div>
      <Button
        onClick={() => {
          void generate()
        }}
        disabled={!input}
        className="bg-primary text-primary-foreground hover:bg-primary/90 w-fit"
      >
        Generate Hashes
      </Button>
      {Object.keys(results).length > 0 && (
        <div className="flex flex-col gap-2">
          {algorithms.map((algo) => (
            <OutputBox key={algo.label} label={algo.label} value={results[algo.label] || ''} />
          ))}
        </div>
      )}
    </ToolLayout>
  )
}
