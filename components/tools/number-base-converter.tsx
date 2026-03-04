'use client'

import { useState } from 'react'
import { Hash } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ToolLayout, OutputBox } from '@/components/tool-layout'

function convert(
  value: string,
  fromBase: number,
): { dec: string; bin: string; oct: string; hex: string } | null {
  const num = parseInt(value, fromBase)
  if (isNaN(num)) return null
  return {
    dec: num.toString(10),
    bin: num.toString(2),
    oct: num.toString(8),
    hex: num.toString(16).toUpperCase(),
  }
}

const bases = [
  { label: 'Binary (2)', base: 2, placeholder: 'e.g. 1010' },
  { label: 'Octal (8)', base: 8, placeholder: 'e.g. 12' },
  { label: 'Decimal (10)', base: 10, placeholder: 'e.g. 10' },
  { label: 'Hexadecimal (16)', base: 16, placeholder: 'e.g. A' },
]

export default function NumberBaseConverterTool() {
  const [input, setInput] = useState('255')
  const [fromBase, setFromBase] = useState(10)
  const result = input ? convert(input, fromBase) : null

  return (
    <ToolLayout
      title="Number Base Converter"
      description="Convert between binary, octal, decimal, and hexadecimal"
      icon={Hash}
    >
      <div className="border-border bg-card rounded-lg border p-5">
        <div className="mb-4 flex flex-wrap gap-2">
          {bases.map((b) => (
            <button
              key={b.base}
              onClick={() => {
                setFromBase(b.base)
                setInput('')
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${fromBase === b.base ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground dark:hover:text-foreground hover:text-white'}`}
            >
              {b.label}
            </button>
          ))}
        </div>
        <div>
          <Label className="text-muted-foreground text-xs">
            Input ({bases.find((b) => b.base === fromBase)?.label})
          </Label>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={bases.find((b) => b.base === fromBase)?.placeholder}
            className="bg-secondary border-border text-foreground mt-1 font-mono"
          />
        </div>
        {result && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <OutputBox label="Decimal" value={result.dec} />
            <OutputBox label="Binary" value={result.bin} />
            <OutputBox label="Octal" value={result.oct} />
            <OutputBox label="Hexadecimal" value={result.hex} />
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
