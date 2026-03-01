'use client'

import { useState } from 'react'
import { Shuffle } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { ToolLayout, OutputBox } from '@/components/tool-layout'

type CaseType = 'upper' | 'lower' | 'title' | 'camel' | 'snake' | 'kebab' | 'pascal' | 'constant'

function toWords(str: string): string[] {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

function convertCase(str: string, to: CaseType): string {
  const words = toWords(str)
  switch (to) {
    case 'upper':
      return str.toUpperCase()
    case 'lower':
      return str.toLowerCase()
    case 'title':
      return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    case 'camel':
      return words
        .map((w, i) =>
          i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase(),
        )
        .join('')
    case 'snake':
      return words.map((w) => w.toLowerCase()).join('_')
    case 'kebab':
      return words.map((w) => w.toLowerCase()).join('-')
    case 'pascal':
      return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('')
    case 'constant':
      return words.map((w) => w.toUpperCase()).join('_')
  }
}

const cases: { label: string; value: CaseType }[] = [
  { label: 'UPPERCASE', value: 'upper' },
  { label: 'lowercase', value: 'lower' },
  { label: 'Title Case', value: 'title' },
  { label: 'camelCase', value: 'camel' },
  { label: 'snake_case', value: 'snake' },
  { label: 'kebab-case', value: 'kebab' },
  { label: 'PascalCase', value: 'pascal' },
  { label: 'CONSTANT_CASE', value: 'constant' },
]

export default function StringUtilitiesTool() {
  const [input, setInput] = useState('')
  const [selectedCase, setSelectedCase] = useState<CaseType>('camel')

  const chars = input.length
  const words = input.trim() ? input.trim().split(/\s+/).length : 0
  const lines = input ? input.split('\n').length : 0
  const bytes = new TextEncoder().encode(input).length

  return (
    <ToolLayout
      title="String Utilities"
      description="Case conversion, character count, reverse, and text manipulation"
      icon={Shuffle}
    >
      <div>
        <Label className="text-muted-foreground text-xs">Input Text</Label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          placeholder="Enter your text here..."
          className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-ring mt-1 w-full resize-none rounded-lg border px-4 py-3 text-sm focus:ring-1 focus:outline-none"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Characters', value: chars },
          { label: 'Words', value: words },
          { label: 'Lines', value: lines },
          { label: 'Bytes', value: bytes },
        ].map((stat) => (
          <div
            key={stat.label}
            className="border-border bg-secondary/50 rounded-lg border px-4 py-3 text-center"
          >
            <p className="text-primary text-2xl font-bold">{stat.value}</p>
            <p className="text-muted-foreground text-xs">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Case conversion */}
      <div className="border-border bg-card rounded-lg border p-5">
        <h3 className="text-foreground mb-3 text-sm font-semibold">Case Conversion</h3>
        <div className="mb-4 flex flex-wrap gap-1.5">
          {cases.map((c) => (
            <button
              key={c.value}
              onClick={() => setSelectedCase(c.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${selectedCase === c.value ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <OutputBox
          label={cases.find((c) => c.value === selectedCase)?.label}
          value={input ? convertCase(input, selectedCase) : ''}
        />
      </div>

      {/* Reverse */}
      <div className="grid gap-3 sm:grid-cols-2">
        <OutputBox label="Reversed" value={input.split('').reverse().join('')} />
        <OutputBox label="Trimmed" value={input.trim()} mono={false} />
      </div>
    </ToolLayout>
  )
}
