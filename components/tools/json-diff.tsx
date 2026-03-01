'use client'

import { useState } from 'react'
import { Braces, ArrowLeftRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToolLayout } from '@/components/tool-layout'

interface DiffEntry {
  path: string
  type: 'added' | 'removed' | 'changed'
  oldValue?: string
  newValue?: string
}

function deepDiff(a: unknown, b: unknown, path = ''): DiffEntry[] {
  const results: DiffEntry[] = []

  if (a === b) return results
  if (typeof a !== typeof b || a === null || b === null) {
    results.push({
      path: path || '(root)',
      type: 'changed',
      oldValue: JSON.stringify(a),
      newValue: JSON.stringify(b),
    })
    return results
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    const maxLen = Math.max(a.length, b.length)
    for (let i = 0; i < maxLen; i++) {
      const p = `${path}[${i}]`
      if (i >= a.length) {
        results.push({ path: p, type: 'added', newValue: JSON.stringify(b[i]) })
      } else if (i >= b.length) {
        results.push({ path: p, type: 'removed', oldValue: JSON.stringify(a[i]) })
      } else {
        results.push(...deepDiff(a[i], b[i], p))
      }
    }
    return results
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aObj = a as Record<string, unknown>
    const bObj = b as Record<string, unknown>
    const allKeys = new Set([...Object.keys(aObj), ...Object.keys(bObj)])
    for (const key of allKeys) {
      const p = path ? `${path}.${key}` : key
      if (!(key in aObj)) {
        results.push({ path: p, type: 'added', newValue: JSON.stringify(bObj[key]) })
      } else if (!(key in bObj)) {
        results.push({ path: p, type: 'removed', oldValue: JSON.stringify(aObj[key]) })
      } else {
        results.push(...deepDiff(aObj[key], bObj[key], p))
      }
    }
    return results
  }

  results.push({
    path: path || '(root)',
    type: 'changed',
    oldValue: JSON.stringify(a),
    newValue: JSON.stringify(b),
  })
  return results
}

export default function JsonDiffTool() {
  const [leftInput, setLeftInput] = useState('')
  const [rightInput, setRightInput] = useState('')
  const [diffs, setDiffs] = useState<DiffEntry[] | null>(null)
  const [error, setError] = useState('')

  const compare = () => {
    try {
      const a = JSON.parse(leftInput)
      const b = JSON.parse(rightInput)
      setDiffs(deepDiff(a, b))
      setError('')
    } catch (e) {
      setError((e as Error).message)
      setDiffs(null)
    }
  }

  return (
    <ToolLayout
      title="JSON Compare"
      description="Compare two JSON objects and see a detailed diff"
      icon={Braces}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-muted-foreground mb-1.5 text-xs font-medium">Left JSON (Original)</p>
          <textarea
            value={leftInput}
            onChange={(e) => setLeftInput(e.target.value)}
            placeholder='{"name": "John", "age": 30}'
            rows={14}
            className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-ring w-full resize-none rounded-lg border px-4 py-3 font-mono text-sm focus:ring-1 focus:outline-none"
          />
        </div>
        <div>
          <p className="text-muted-foreground mb-1.5 text-xs font-medium">Right JSON (Modified)</p>
          <textarea
            value={rightInput}
            onChange={(e) => setRightInput(e.target.value)}
            placeholder='{"name": "Jane", "age": 31, "city": "NYC"}'
            rows={14}
            className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-ring w-full resize-none rounded-lg border px-4 py-3 font-mono text-sm focus:ring-1 focus:outline-none"
          />
        </div>
      </div>

      <Button
        onClick={compare}
        className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
      >
        <ArrowLeftRight className="h-4 w-4" />
        Compare
      </Button>

      {error && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 font-mono text-sm">
          {error}
        </div>
      )}

      {diffs !== null && (
        <div className="border-border bg-card overflow-hidden rounded-lg border">
          {diffs.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-primary text-sm font-medium">No differences found</p>
              <p className="text-muted-foreground mt-1 text-xs">Both JSON objects are identical</p>
            </div>
          ) : (
            <>
              <div className="border-border bg-secondary/30 flex items-center justify-between border-b px-5 py-3">
                <p className="text-foreground text-xs font-semibold">
                  {diffs.length} difference{diffs.length !== 1 ? 's' : ''} found
                </p>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Added
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                    Removed
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    Changed
                  </span>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {diffs.map((d, i) => (
                  <div
                    key={i}
                    className="border-border/50 flex flex-col gap-1.5 border-b px-5 py-3 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
                          d.type === 'added'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : d.type === 'removed'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {d.type}
                      </span>
                      <code className="text-foreground text-xs font-medium">{d.path}</code>
                    </div>
                    <div className="flex flex-col gap-0.5 pl-1">
                      {d.oldValue !== undefined && (
                        <p className="font-mono text-xs text-red-400">
                          <span className="mr-1.5 text-red-500/60 select-none">-</span>
                          {d.oldValue}
                        </p>
                      )}
                      {d.newValue !== undefined && (
                        <p className="font-mono text-xs text-emerald-400">
                          <span className="mr-1.5 text-emerald-500/60 select-none">+</span>
                          {d.newValue}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </ToolLayout>
  )
}
