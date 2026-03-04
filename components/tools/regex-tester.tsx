'use client'

import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import { ToolLayout } from '@/components/tool-layout'

interface MatchInfo {
  text: string
  index: number
  groups: string[]
}

function getFlags(flags: Record<string, boolean>): string {
  let f = ''
  if (flags.global) f += 'g'
  if (flags.caseInsensitive) f += 'i'
  if (flags.multiline) f += 'm'
  if (flags.dotAll) f += 's'
  if (flags.unicode) f += 'u'
  return f
}

export default function RegexTesterTool() {
  const [pattern, setPattern] = useState('')
  const [testStr, setTestStr] = useState('')
  const [flags, setFlags] = useState({
    global: true,
    caseInsensitive: false,
    multiline: false,
    dotAll: false,
    unicode: false,
  })
  const [error, setError] = useState('')

  const { matches, highlightedHtml } = useMemo(() => {
    if (!pattern || !testStr) return { matches: [] as MatchInfo[], highlightedHtml: '' }
    try {
      const flagStr = getFlags(flags)
      const re = new RegExp(pattern, flagStr)
      setError('')

      const found: MatchInfo[] = []
      let match: RegExpExecArray | null
      const parts: { text: string; isMatch: boolean }[] = []
      let lastIndex = 0

      if (flagStr.includes('g')) {
        while ((match = re.exec(testStr)) !== null) {
          if (match.index > lastIndex) {
            parts.push({ text: testStr.slice(lastIndex, match.index), isMatch: false })
          }
          parts.push({ text: match[0], isMatch: true })
          found.push({
            text: match[0],
            index: match.index,
            groups: match.slice(1),
          })
          lastIndex = match.index + match[0].length
          if (match[0].length === 0) {
            re.lastIndex++
            if (re.lastIndex > testStr.length) break
          }
        }
      } else {
        match = re.exec(testStr)
        if (match) {
          if (match.index > 0) {
            parts.push({ text: testStr.slice(0, match.index), isMatch: false })
          }
          parts.push({ text: match[0], isMatch: true })
          found.push({
            text: match[0],
            index: match.index,
            groups: match.slice(1),
          })
          lastIndex = match.index + match[0].length
        }
      }
      if (lastIndex < testStr.length) {
        parts.push({ text: testStr.slice(lastIndex), isMatch: false })
      }

      const html = parts
        .map((p) => {
          const escaped = p.text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br/>')
          return p.isMatch
            ? `<mark class="rounded px-0.5" style="background:oklch(0.72 0.19 160 / 0.3);color:oklch(0.85 0.15 160)">${escaped}</mark>`
            : escaped
        })
        .join('')

      return { matches: found, highlightedHtml: html }
    } catch (e) {
      setError((e as Error).message)
      return { matches: [] as MatchInfo[], highlightedHtml: '' }
    }
  }, [pattern, testStr, flags])

  const flagEntries: { key: keyof typeof flags; label: string; short: string }[] = [
    { key: 'global', label: 'Global', short: 'g' },
    { key: 'caseInsensitive', label: 'Case Insensitive', short: 'i' },
    { key: 'multiline', label: 'Multiline', short: 'm' },
    { key: 'dotAll', label: 'Dot All', short: 's' },
    { key: 'unicode', label: 'Unicode', short: 'u' },
  ]

  return (
    <ToolLayout
      title="Regex Tester"
      description="Test regular expressions with real-time highlighting and match details"
      icon={Search}
    >
      {/* Pattern */}
      <div>
        <p className="text-muted-foreground mb-1.5 text-xs font-medium">Regular Expression</p>
        <div className="border-border bg-secondary/50 flex items-center rounded-lg border px-4 py-3">
          <span className="text-muted-foreground mr-1 shrink-0 font-mono text-sm">/</span>
          <input
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="text-foreground placeholder:text-muted-foreground flex-1 bg-transparent font-mono text-sm focus:outline-none"
            placeholder="[a-z]+\\d+"
          />
          <span className="text-muted-foreground ml-1 shrink-0 font-mono text-sm">
            /{getFlags(flags)}
          </span>
        </div>
      </div>

      {/* Flags */}
      <div className="flex flex-wrap gap-1.5">
        {flagEntries.map(({ key, label, short }) => (
          <button
            key={key}
            onClick={() => setFlags((f) => ({ ...f, [key]: !f[key] }))}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              flags[key]
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground dark:hover:text-foreground hover:text-foreground'
            }`}
          >
            <span className="font-mono font-bold">{short}</span>
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 font-mono text-sm">
          {error}
        </div>
      )}

      {/* Test string */}
      <div>
        <p className="text-muted-foreground mb-1.5 text-xs font-medium">Test String</p>
        <textarea
          value={testStr}
          onChange={(e) => setTestStr(e.target.value)}
          placeholder="Enter your test string here..."
          rows={5}
          className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-ring w-full resize-none rounded-lg border px-4 py-3 font-mono text-sm focus:ring-1 focus:outline-none"
        />
      </div>

      {/* Highlighted preview */}
      {testStr && pattern && !error && (
        <div>
          <p className="text-muted-foreground mb-1.5 text-xs font-medium">Match Preview</p>
          <div
            className="border-border bg-secondary/50 text-foreground min-h-[80px] rounded-lg border px-4 py-3 font-mono text-sm break-all whitespace-pre-wrap"
            dangerouslySetInnerHTML={{
              __html:
                highlightedHtml ||
                testStr.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>'),
            }}
          />
        </div>
      )}

      {/* Match details */}
      {matches.length > 0 && (
        <div className="border-border bg-card overflow-hidden rounded-lg border">
          <div className="border-border bg-secondary/30 flex items-center justify-between border-b px-5 py-3">
            <p className="text-foreground text-xs font-semibold">
              {matches.length} match{matches.length !== 1 ? 'es' : ''}
            </p>
          </div>
          <div className="divide-border/50 max-h-72 divide-y overflow-y-auto">
            {matches.map((m, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-3">
                <span className="bg-primary/15 text-primary mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <code className="text-foreground font-mono text-sm break-all">{m.text}</code>
                  <p className="text-muted-foreground mt-0.5 text-xs">Index: {m.index}</p>
                  {m.groups.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {m.groups.map((g, gi) => (
                        <span
                          key={gi}
                          className="bg-secondary text-foreground rounded px-2 py-0.5 font-mono text-xs"
                        >
                          ${gi + 1}: {g ?? 'undefined'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
