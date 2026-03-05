'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ToolLayout, OutputArea } from '@/components/tool-layout'
import { tools } from '@/lib/tools'

function jsonToSchema(value: unknown): Record<string, unknown> {
  if (value === null) return { type: 'null' }
  if (typeof value === 'string') return { type: 'string' }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { type: 'integer' } : { type: 'number' }
  }
  if (typeof value === 'boolean') return { type: 'boolean' }

  if (Array.isArray(value)) {
    if (value.length === 0) return { type: 'array', items: {} }
    return { type: 'array', items: jsonToSchema(value[0]) }
  }

  if (typeof value === 'object') {
    const properties: Record<string, unknown> = {}
    const required: string[] = []
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      properties[key] = jsonToSchema(val)
      required.push(key)
    }
    return {
      type: 'object',
      properties,
      required,
    }
  }

  return {}
}

export default function JsonToSchemaTool() {
  const tool = tools.find((t) => t.id === 'json-to-schema')!
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const convert = () => {
    try {
      const parsed = JSON.parse(input)
      const schema = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        ...jsonToSchema(parsed),
      }
      setOutput(JSON.stringify(schema, null, 2))
      setError('')
    } catch (e) {
      setError((e as Error).message)
      setOutput('')
    }
  }

  return (
    <ToolLayout title={tool.name} description={tool.description} icon={tool.icon}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-muted-foreground min-h-[30px] text-xs font-medium">Input JSON</p>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder='{"name": "John", "age": 30}'
              rows={16}
              className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-ring w-full resize-none rounded-lg border px-4 py-3 font-mono text-sm focus:ring-1 focus:outline-none"
            />
          </div>
          <Button
            onClick={convert}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Generate Schema
          </Button>
        </div>
        <OutputArea label="JSON Schema (Draft-07)" value={output} rows={16} />
      </div>
      {error && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 font-mono text-sm">
          {error}
        </div>
      )}
    </ToolLayout>
  )
}
