'use client'

import { useState, useCallback, useMemo } from 'react'
import {
  Copy,
  CheckCircle2,
  RefreshCcw,
  Sparkles,
  ClipboardPaste,
  Scissors,
  Download,
} from 'lucide-react'
import { ToolLayout } from '@/components/tool-layout'
import { tools } from '@/lib/tools'
import { useCopyToClipboard } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const SAMPLE_MARKDOWN = `# Q3 Product Roadmap — Mobile Team

**Owner:** Sarah Chen (Product Manager)
**Last Updated:** April 14, 2026
**Status:** In Review

---

## Executive Summary

This roadmap outlines the **key initiatives** for the mobile team in Q3 2026. Our primary focus is improving *user retention* and expanding ***payment infrastructure*** across Southeast Asian markets.

> ⚠️ All timelines are subject to change pending stakeholder approval in the April 18 review meeting.

---

## Strategic Goals

- Increase DAU by **25%** through personalization features
- Reduce app crash rate from 1.8% to below **0.5%**
- Launch in 3 new markets: Vietnam, Philippines, Malaysia
- Achieve **WCAG 2.1 AA** accessibility compliance

---

## Epics & User Stories

### Epic 1 — Personalized Home Feed

**Goal:** Show users content relevant to their purchase history and browsing behavior.

**Acceptance Criteria:**
1. Feed refreshes every 15 minutes in the background
2. Users can tap "Not Interested" to exclude a category
3. Works fully offline using cached data

**Tech Notes:**

\`\`\`typescript
interface FeedConfig {
  userId: string
  refreshInterval: number
  maxItems: number
  enableOfflineCache: boolean
}

const defaultConfig: FeedConfig = {
  userId: '',
  refreshInterval: 900,
  maxItems: 50,
  enableOfflineCache: true,
}
\`\`\`

---

### Epic 2 — Multi-Currency Checkout

**Goal:** Support local payment methods and currencies without redirecting users to a web browser.

**Supported Payment Methods:**
- PromptPay (Thailand)
- GCash (Philippines)
- VNPay (Vietnam)
- Grab Pay (Regional)

**API Endpoints:**

\`\`\`
POST /api/v3/checkout/initiate
POST /api/v3/payment/:provider/authorize
GET  /api/v3/payment/:transactionId/status
DELETE /api/v3/cart/:cartId
\`\`\`

> Each request must include \`X-Device-ID\` and \`X-App-Version\` headers.
> Timeout is set to **10 seconds** — always handle the loading state gracefully.

---

## Sprint Timeline

| Sprint | Dates | Focus Area | Team Lead |
|---|---|---|---|
| Sprint 11 | Apr 1–14 | Foundation & API contracts | James |
| Sprint 12 | Apr 15–28 | Core checkout flow | Emily |
| Sprint 13 | May 1–14 | Personalization engine | Kevin |
| Sprint 14 | May 15–28 | QA, accessibility, polish | Sarah |
| Release | Jun 2 | Production rollout | All |

---

## Out of Scope

~~Apple Pay integration~~ — deferred to Q4
~~Cryptocurrency payments~~ — not on roadmap
~~Desktop web parity~~ — separate team owns this

---

## Dependencies & Risks

### External Dependencies

1. **Payment gateway API** — GCash sandbox access required by Apr 18
2. **Design system update** — DS v4.2 must ship before Sprint 12 starts
3. **Backend rate limits** — confirm limits with infra team before load testing

### Known Risks

- *Third-party SDK* for VNPay is poorly documented — allocate extra buffer time
- App Store review may delay release by **3–5 business days**
- Analytics pipeline migration could affect A/B test reporting in Sprint 13

---

## References

- [Figma Designs](https://figma.com/file/xyz)
- [API Documentation](https://docs.internal/api-v3)
- [Analytics Dashboard](https://analytics.internal/mobile-q3)
- [Slack Channel](https://slack.com/archives/mobile-roadmap)

---

*Questions? Ping Sarah Chen in #mobile-team or leave a comment in Notion.*
`

const mapToMathChars = (text: string, type: 'bold' | 'italic' | 'boldItalic'): string => {
  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0)

      if (code >= 0x41 && code <= 0x5a) {
        if (type === 'bold') return String.fromCodePoint(0x1d5d4 + (code - 0x41))
        if (type === 'italic') return String.fromCodePoint(0x1d608 + (code - 0x41))
        if (type === 'boldItalic') return String.fromCodePoint(0x1d63c + (code - 0x41))
      }
      if (code >= 0x61 && code <= 0x7a) {
        if (type === 'bold') return String.fromCodePoint(0x1d5ee + (code - 0x61))
        if (type === 'italic') return String.fromCodePoint(0x1d622 + (code - 0x61))
        if (type === 'boldItalic') return String.fromCodePoint(0x1d656 + (code - 0x61))
      }
      if (code >= 0x30 && code <= 0x39) {
        if (type === 'bold' || type === 'boldItalic')
          return String.fromCodePoint(0x1d7ec + (code - 0x30))
        return char
      }

      return char
    })
    .join('')
}

const splitIntoMessages = (text: string, limit: number = 5000): string[] => {
  if (text.length <= limit) return [text]

  const messages: string[] = []
  let remaining = text

  while (remaining.length > 0) {
    if (remaining.length <= limit) {
      messages.push(remaining)
      break
    }

    let splitAt = limit
    const newlineIdx = remaining.lastIndexOf('\n\n', limit)
    const singleNewlineIdx = remaining.lastIndexOf('\n', limit)

    if (newlineIdx > limit * 0.5) {
      splitAt = newlineIdx
    } else if (singleNewlineIdx > limit * 0.5) {
      splitAt = singleNewlineIdx
    }

    messages.push(remaining.slice(0, splitAt).trimEnd())
    remaining = remaining.slice(splitAt).trimStart()
  }

  return messages
}

export default function LineMessageFormatter() {
  const tool = tools.find((t) => t.id === 'line-message-formatter')!
  const copyToClipboard = useCopyToClipboard()

  const [input, setInput] = useState('')
  const [copied, setCopied] = useState(false)
  const [preserveLineBreaks, setPreserveLineBreaks] = useState(true)
  const [convertHeadingsEmoji, setConvertHeadingsEmoji] = useState(true)
  const [collapseBlankLines, setCollapseBlankLines] = useState(true)
  const [boldItalicMode, setBoldItalicMode] = useState('unicode')

  const [pasteError, setPasteError] = useState(false)
  const [showSplit, setShowSplit] = useState(false)
  const [copiedSplitIndex, setCopiedSplitIndex] = useState<number | null>(null)

  const handleCopy = useCallback(
    (text: string) => {
      void copyToClipboard(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    },
    [copyToClipboard],
  )

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      setInput(text)
    } catch {
      setPasteError(true)
      setTimeout(() => setPasteError(false), 2000)
    }
  }, [])

  const output = useMemo(() => {
    let result = input

    if (convertHeadingsEmoji) {
      result = result.replace(/^#\s+(.*$)/gm, (_, p1) => `🔷 ${p1.toUpperCase()}`)
      result = result.replace(/^##\s+(.*$)/gm, (_, p1) => `▪️ ${p1}`)
      result = result.replace(/^###\s+(.*$)/gm, (_, p1) => `› ${p1}`)
    } else {
      result = result.replace(/^#+\s+(.*$)/gm, '$1')
    }

    result = result.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
      const label = lang ? `[ ${lang} ]\n` : ''
      const indented = code
        .trimEnd()
        .split('\n')
        .map((l: string) => {
          if (l.trim() === '') return '    '
          return '    ' + l
        })
        .join('\n')
      return label + indented
    })

    if (boldItalicMode === 'unicode') {
      result = result.replace(/\*\*\*([\s\S]*?)\*\*\*/g, (_, p1) =>
        mapToMathChars(p1, 'boldItalic'),
      )
      result = result.replace(/\*\*([\s\S]*?)\*\*/g, (_, p1) => mapToMathChars(p1, 'bold'))
      result = result.replace(/__([\s\S]*?)__/g, (_, p1) => mapToMathChars(p1, 'bold'))
      result = result.replace(/\*([\s\S]*?)\*/g, (_, p1) => mapToMathChars(p1, 'italic'))
      result = result.replace(/_([\s\S]*?)_/g, (_, p1) => mapToMathChars(p1, 'italic'))
    }

    result = result.replace(/`([^`]+)`/g, '「$1」')

    result = result.replace(/^(\s*)[-*]\s+(.*$)/gm, (_, indent, text) => {
      const level = Math.floor(indent.length / 2)
      return '  '.repeat(level) + '• ' + text
    })

    result = result.replace(/^>\s+(.*$)/gm, '❝ $1')

    result = result.replace(/^(---|___|\*\*\*)$/gm, '─────────────')

    result = result.replace(/!\[([^\]]*)\]\((.*?)\)/g, '🖼 $1')

    result = result.replace(/\[([^\]]+)\]\((.*?)\)/g, '$1 ($2)')

    result = result.replace(/~~([\s\S]*?)~~/g, '~$1~')

    result = result.replace(/^\|[-|\s:]+\|$/gm, '§TABLE_SEP§')
    const tableLines = result.split('\n')
    result = tableLines
      .map((line) => {
        if (line === '§TABLE_SEP§') return '  ─────────────'
        if (/^\|.*\|$/.test(line)) {
          const cells = line
            .replace(/^\|/, '')
            .replace(/\|$/, '')
            .split('|')
            .map((c: string) => c.trim())
            .filter(Boolean)
          return cells.join('  |  ')
        }
        return line
      })
      .join('\n')

    if (collapseBlankLines) {
      result = result.replace(/\n{3,}/g, '\n\n')
    }

    if (!preserveLineBreaks) {
      result = result.replace(/\n/g, ' ')
    }

    return result
  }, [input, boldItalicMode, convertHeadingsEmoji, collapseBlankLines, preserveLineBreaks])

  const splitMessages = useMemo(
    () => (showSplit ? splitIntoMessages(output) : []),
    [output, showSplit],
  )

  const handleCopySplit = useCallback(
    (text: string, index: number) => {
      void copyToClipboard(text)
      setCopiedSplitIndex(index)
      setTimeout(() => setCopiedSplitIndex(null), 2000)
    },
    [copyToClipboard],
  )

  const handleDownload = useCallback(() => {
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'line-message.txt'
    a.click()
    URL.revokeObjectURL(url)
  }, [output])

  return (
    <>
      <style>{`
        :root {
          --line-bubble-bg: #86D97B;
          --line-bubble-border: #6bc962;
          --line-bubble-text: #111111;
        }
        .dark {
          --line-bubble-bg: rgba(134, 217, 123, 0.15);
          --line-bubble-border: rgba(134, 217, 123, 0.3);
          --line-bubble-text: #f1f1f1;
        }
      `}</style>
      <ToolLayout title={tool.name} description={tool.description} icon={tool.icon}>
        <div className="flex flex-col gap-6">
          <div className="border-border bg-card rounded-xl border p-4 shadow-sm sm:p-6">
            <h2 className="text-foreground mb-4 text-sm font-semibold">Conversion Options</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                  <Label
                    htmlFor="preserveLineBreaks"
                    className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    Preserve line breaks
                  </Label>
                  <Switch
                    id="preserveLineBreaks"
                    checked={preserveLineBreaks}
                    onCheckedChange={setPreserveLineBreaks}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Label
                    htmlFor="convertHeadingsEmoji"
                    className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    Convert headings with emoji
                  </Label>
                  <Switch
                    id="convertHeadingsEmoji"
                    checked={convertHeadingsEmoji}
                    onCheckedChange={setConvertHeadingsEmoji}
                  />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Label
                    htmlFor="collapseBlankLines"
                    className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                  >
                    Collapse multiple blank lines
                  </Label>
                  <Switch
                    id="collapseBlankLines"
                    checked={collapseBlankLines}
                    onCheckedChange={setCollapseBlankLines}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <Label className="text-muted-foreground">Bold/Italic Mode</Label>
                <RadioGroup
                  value={boldItalicMode}
                  onValueChange={setBoldItalicMode}
                  className="flex flex-col gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="unicode" id="unicode" />
                    <Label
                      htmlFor="unicode"
                      className="text-muted-foreground hover:text-foreground cursor-pointer font-normal transition-colors"
                    >
                      Unicode chars (𝗯𝗼𝗹𝗱, 𝘪𝘵𝘢𝘭𝘪𝘤)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="keep" id="keep" />
                    <Label
                      htmlFor="keep"
                      className="text-muted-foreground hover:text-foreground cursor-pointer font-normal transition-colors"
                    >
                      Keep as-is (**asterisks**)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-3">
                <Label className="text-foreground text-sm font-semibold">Markdown Input</Label>
                <div className="scrollbar-hide flex w-full items-center gap-1.5 overflow-x-auto pb-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setInput(SAMPLE_MARKDOWN)}
                    className="text-muted-foreground hover:bg-secondary/80 hover:text-foreground h-8 gap-1.5 text-xs transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Load Sample
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void handlePaste()}
                    className="text-muted-foreground hover:bg-secondary/80 hover:text-foreground h-8 gap-1.5 text-xs transition-colors"
                  >
                    <ClipboardPaste className="h-3.5 w-3.5" />
                    {pasteError ? 'No access' : 'Paste'}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setInput('')}
                    className="text-muted-foreground hover:bg-secondary/80 hover:text-foreground h-8 gap-1.5 text-xs transition-colors"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" />
                    Clear
                  </Button>
                </div>
              </div>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Paste your Markdown text here..."
                className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-ring min-h-[300px] w-full resize-y rounded-xl border p-4 font-mono text-sm focus:ring-1 focus:outline-none sm:min-h-[400px]"
              />
              <div className="text-muted-foreground text-right text-xs font-medium">
                {input.length} characters
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-3">
                <Label className="text-foreground text-sm font-semibold">LINE Output</Label>
                <div className="scrollbar-hide flex w-full items-center gap-1.5 overflow-x-auto pb-1">
                  {output.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownload}
                      className="text-muted-foreground hover:bg-secondary/80 hover:text-foreground h-8 gap-1.5 text-xs transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download
                    </Button>
                  )}
                  {output.length > 5000 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSplit((v) => !v)}
                      className={`h-8 gap-1.5 text-xs transition-colors ${
                        showSplit
                          ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary'
                          : 'bg-secondary/30 text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                      }`}
                    >
                      <Scissors className="h-3.5 w-3.5" />
                      {showSplit ? 'Hide Split' : 'Split Messages'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(output)}
                    className="bg-secondary/30 text-muted-foreground hover:bg-secondary/80 hover:text-foreground h-8 gap-1.5 text-xs transition-colors"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    {copied ? 'Copied' : 'Copy Output'}
                  </Button>
                </div>
              </div>
              <textarea
                value={output}
                readOnly
                className="border-border bg-secondary/10 text-muted-foreground focus:ring-ring min-h-[300px] w-full resize-y rounded-xl border p-4 font-mono text-sm focus:ring-1 focus:outline-none sm:min-h-[400px]"
              />
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span
                    className={
                      output.length > 5000
                        ? 'text-destructive font-medium'
                        : 'text-muted-foreground'
                    }
                  >
                    {output.length > 5000 ? '⚠️ Exceeds LINE limit' : 'LINE character limit'}
                  </span>
                  <span
                    className={`tabular-nums ${
                      output.length > 5000
                        ? 'text-destructive font-medium'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {output.length.toLocaleString()} / 5,000
                  </span>
                </div>
                <div className="bg-secondary h-1.5 w-full overflow-hidden rounded-full">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      output.length > 5000
                        ? 'bg-destructive'
                        : output.length > 4000
                          ? 'bg-yellow-500'
                          : 'bg-primary'
                    }`}
                    style={{ width: `${Math.min((output.length / 5000) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {showSplit && splitMessages.length > 1 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-foreground text-sm font-semibold">Split Messages</Label>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {splitMessages.length} messages
                </span>
              </div>
              <div className="flex flex-col gap-3">
                {splitMessages.map((msg, i) => (
                  <div
                    key={i}
                    className="border-border bg-secondary/10 overflow-hidden rounded-xl border"
                  >
                    <div className="border-border bg-secondary/20 flex items-center justify-between gap-2 border-b px-4 py-2">
                      <span className="text-muted-foreground text-xs font-medium tabular-nums">
                        Message {i + 1} / {splitMessages.length}
                        <span className="text-muted-foreground/60 ml-2">
                          {msg.length.toLocaleString()} chars
                        </span>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopySplit(msg, i)}
                        className="text-muted-foreground hover:bg-secondary/80 hover:text-foreground h-7 gap-1.5 text-xs transition-colors"
                      >
                        {copiedSplitIndex === i ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                        {copiedSplitIndex === i ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                    <pre className="text-muted-foreground overflow-x-auto p-4 font-mono text-sm break-words whitespace-pre-wrap">
                      {msg}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mx-auto flex w-full max-w-lg flex-col gap-2 pt-4">
            <Label className="text-muted-foreground text-center text-sm font-semibold">
              Live Preview
            </Label>
            <div
              style={{
                backgroundColor: 'var(--line-bubble-bg)',
                borderColor: 'var(--line-bubble-border)',
                color: 'var(--line-bubble-text)',
              }}
              className="relative min-h-[60px] rounded-2xl rounded-tr-sm border p-4 text-[15px] leading-relaxed break-words whitespace-pre-wrap shadow-sm"
            >
              {output || 'Your LINE message preview will appear here...'}
            </div>
          </div>

          <div className="pt-8">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="cheatsheet" className="border-border">
                <AccordionTrigger className="text-foreground text-sm font-semibold transition-colors hover:no-underline">
                  Conversion Rules Cheat Sheet
                </AccordionTrigger>
                <AccordionContent>
                  <div className="border-border overflow-x-auto rounded-lg border shadow-sm">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead>
                        <tr className="bg-muted/50 border-border border-b">
                          <th className="text-muted-foreground p-3 font-semibold">
                            Markdown Syntax
                          </th>
                          <th className="border-border text-foreground border-l p-3 font-semibold">
                            LINE Output
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-border text-muted-foreground divide-y">
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono text-xs"># Heading 1</td>
                          <td className="border-border border-l p-3">🔷 HEADING 1</td>
                        </tr>
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono text-xs">## Heading 2</td>
                          <td className="border-border border-l p-3">▪️ Heading 2</td>
                        </tr>
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono text-xs">### Heading 3</td>
                          <td className="border-border border-l p-3">› Heading 3</td>
                        </tr>
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono text-xs">**bold**</td>
                          <td className="border-border text-foreground border-l p-3">
                            𝗯𝗼𝗹𝗱 (Unicode characters)
                          </td>
                        </tr>
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono text-xs">*italic*</td>
                          <td className="border-border text-foreground border-l p-3">
                            𝘪𝘵𝘢𝘭𝘪𝘤 (Unicode characters)
                          </td>
                        </tr>
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono text-xs">\`inline code\`</td>
                          <td className="border-border border-l p-3">「inline code」</td>
                        </tr>
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono text-xs">- list item</td>
                          <td className="border-border border-l p-3">• list item</td>
                        </tr>
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono text-xs">&gt; blockquote</td>
                          <td className="border-border border-l p-3">❝ blockquote</td>
                        </tr>
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono text-xs">---</td>
                          <td className="border-border border-l p-3">─────────────</td>
                        </tr>
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono text-xs">[text](url)</td>
                          <td className="border-border border-l p-3">text (url)</td>
                        </tr>
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono text-xs">![alt](url)</td>
                          <td className="border-border border-l p-3">🖼 alt</td>
                        </tr>
                        <tr className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-mono text-xs">~~strikethrough~~</td>
                          <td className="border-border border-l p-3">~strikethrough~</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </ToolLayout>
    </>
  )
}
