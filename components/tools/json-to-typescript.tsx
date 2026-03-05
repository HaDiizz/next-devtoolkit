'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToolLayout, OutputArea } from '@/components/tool-layout'
import { tools } from '@/lib/tools'

function jsonToTsInterface(json: unknown, name: string, indent = 0): string {
  const pad = '  '.repeat(indent)
  const innerPad = '  '.repeat(indent + 1)

  if (typeof json !== 'object' || json === null) {
    return `${pad}type ${name} = ${primitiveType(json)}`
  }

  if (Array.isArray(json)) {
    if (json.length === 0) return `${pad}type ${name} = unknown[]`
    const itemType = jsonToTsInterface(json[0], `${name}Item`, indent)
    if (typeof json[0] === 'object' && json[0] !== null && !Array.isArray(json[0])) {
      return `${itemType}\n\n${pad}type ${name} = ${name}Item[]`
    }
    return `${pad}type ${name} = ${primitiveType(json[0])}[]`
  }

  const entries = Object.entries(json as Record<string, unknown>)
  const nested: string[] = []
  const fields: string[] = []

  for (const [key, value] of entries) {
    const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`
    if (value === null || value === undefined) {
      fields.push(`${innerPad}${safeKey}: unknown`)
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        fields.push(`${innerPad}${safeKey}: unknown[]`)
      } else if (typeof value[0] === 'object' && value[0] !== null) {
        const childName = capitalize(key) + 'Item'
        nested.push(jsonToTsInterface(value[0], childName, indent))
        fields.push(`${innerPad}${safeKey}: ${childName}[]`)
      } else {
        fields.push(`${innerPad}${safeKey}: ${primitiveType(value[0])}[]`)
      }
    } else if (typeof value === 'object') {
      const childName = capitalize(key)
      nested.push(jsonToTsInterface(value, childName, indent))
      fields.push(`${innerPad}${safeKey}: ${childName}`)
    } else {
      fields.push(`${innerPad}${safeKey}: ${primitiveType(value)}`)
    }
  }

  const interfaceStr = `${pad}interface ${name} {\n${fields.join('\n')}\n${pad}}`
  return nested.length > 0 ? `${nested.join('\n\n')}\n\n${interfaceStr}` : interfaceStr
}

function primitiveType(value: unknown): string {
  if (value === null || value === undefined) return 'unknown'
  if (typeof value === 'string') return 'string'
  if (typeof value === 'number') return 'number'
  if (typeof value === 'boolean') return 'boolean'
  return 'unknown'
}

function capitalize(s: string): string {
  return s.replace(/(?:^|[_-])(\w)/g, (_, c) => c.toUpperCase())
}

export default function JsonToTypescriptTool() {
  const tool = tools.find((t) => t.id === 'json-to-typescript')!
  const [input, setInput] = useState('')
  const [rootName, setRootName] = useState('Root')
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  const convert = () => {
    try {
      const parsed = JSON.parse(input)
      setOutput(jsonToTsInterface(parsed, rootName || 'Root'))
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
              placeholder='{"name": "John", "age": 30, "active": true}'
              rows={16}
              className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-ring w-full resize-none rounded-lg border px-4 py-3 font-mono text-sm focus:ring-1 focus:outline-none"
            />
          </div>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <p className="text-muted-foreground mb-1.5 text-xs font-medium">
                Root Interface Name
              </p>
              <Input
                value={rootName}
                onChange={(e) => setRootName(e.target.value)}
                placeholder="Root"
                className="bg-secondary border-border text-foreground font-mono"
              />
            </div>
            <Button
              onClick={convert}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Generate
            </Button>
          </div>
        </div>
        <OutputArea label="TypeScript Interface" value={output} rows={16} />
      </div>
      {error && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 font-mono text-sm">
          {error}
        </div>
      )}
    </ToolLayout>
  )
}
