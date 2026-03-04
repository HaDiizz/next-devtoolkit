'use client'

import { useState } from 'react'
import { Braces, ArrowDown, ArrowUp, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToolLayout, OutputArea } from '@/components/tool-layout'

export default function JsonFormatterTool() {
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [indent, setIndent] = useState(2)

  const prettify = () => {
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed, null, indent))
      setError('')
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  const minify = () => {
    try {
      const parsed = JSON.parse(input)
      setOutput(JSON.stringify(parsed))
      setError('')
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  const validate = () => {
    try {
      JSON.parse(input)
      setError('')
      setOutput('Valid JSON')
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  return (
    <ToolLayout
      title="JSON Formatter"
      description="Prettify, minify, and validate JSON data"
      icon={Braces}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Input */}
        <div>
          <p className="text-muted-foreground min-h-[30px] text-xs font-medium">Input JSON</p>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"key": "value"}'
            rows={14}
            className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-ring w-full resize-none rounded-lg border px-4 py-3 font-mono text-sm focus:ring-1 focus:outline-none"
          />
        </div>

        {/* Output */}
        <div>
          <OutputArea label="Output" value={output} rows={14} />
        </div>
      </div>

      {error && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg border px-4 py-3 text-sm">
          <X className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="font-mono text-xs">{error}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="border-border bg-secondary/50 flex min-h-[30px] items-center gap-2 rounded-lg border px-3">
          <span className="text-muted-foreground text-xs">Indent:</span>
          {[2, 4].map((n) => (
            <button
              key={n}
              onClick={() => setIndent(n)}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${indent === n ? 'bg-primary text-primary-foreground' : 'text-muted-foreground dark:hover:text-foreground hover:text-foreground'}`}
            >
              {n}
            </button>
          ))}
        </div>
        <Button
          onClick={prettify}
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
        >
          <ArrowDown className="h-4 w-4" />
          Prettify
        </Button>
        <Button onClick={minify} variant="secondary" className="gap-2">
          <ArrowUp className="h-4 w-4" />
          Minify
        </Button>
        <Button onClick={validate} variant="secondary" className="gap-2">
          <Check className="h-4 w-4" />
          Validate
        </Button>
      </div>
    </ToolLayout>
  )
}
