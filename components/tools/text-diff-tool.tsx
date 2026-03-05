'use client'

import { useState, useEffect } from 'react'
import { useCopyToClipboard } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowRightLeft, Copy, Check } from 'lucide-react'
import { ToolLayout } from '@/components/tool-layout'
import { tools } from '@/lib/tools'

import * as Diff from 'diff'

export default function TextDiffTool() {
  const tool = tools.find((t) => t.id === 'text-diff-tool')!
  const [original, setOriginal] = useState(
    'function calculateTotal(items) {n  let sum = 0;n  for (let i = 0; i < items.length; i++) {n    sum += items[i].price;n  }n  return sum;n}',
  )
  const [modified, setModified] = useState(
    'function calculateTotal(items, discount = 0) {n  let sum = 0;n  for (const item of items) {n    sum += item.price;n  }n  return sum - discount;n}',
  )
  const [ignoreCase, setIgnoreCase] = useState(false)
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false)

  const [viewMode, setViewMode] = useState<'split' | 'unified'>('split')
  const [diffResult, setDiffResult] = useState<Diff.Change[]>([])

  const [copied, setCopied] = useState(false)
  const copyToClipboard = useCopyToClipboard()

  useEffect(() => {
    const opts = {
      ignoreCase,
      ignoreWhitespace,
    }

    const diff = Diff.diffLines(original, modified, opts)
    setDiffResult(diff)
  }, [original, modified, ignoreCase, ignoreWhitespace])

  const swapText = () => {
    const temp = original
    setOriginal(modified)
    setModified(temp)
  }

  const copyPatch = () => {
    const patch = Diff.createPatch('file.txt', original, modified, 'original', 'modified', {
      context: 3,
    })
    void copyToClipboard(patch)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const numChanges = diffResult
    .filter((d) => d.added || d.removed)
    .reduce((acc, d) => acc + (d.count || 0), 0)
  const numAdded = diffResult.filter((d) => d.added).reduce((acc, d) => acc + (d.count || 0), 0)
  const numRemoved = diffResult.filter((d) => d.removed).reduce((acc, d) => acc + (d.count || 0), 0)

  const getInlineDiff = (aStr: string, bStr: string, removal: boolean) => {
    if (!Diff)
      return (
        <span
          className={
            removal
              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
              : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
          }
        >
          {removal ? aStr : bStr}
        </span>
      )

    const inline = Diff.diffWords(aStr, bStr)
    return inline.map((part: Diff.Change, i: number) => {
      if (removal && part.added) return null
      if (!removal && part.removed) return null

      const isChanged = (removal && part.removed) || (!removal && part.added)
      return (
        <span
          key={i}
          className={
            isChanged ? (removal ? 'bg-rose-500/40 font-bold' : 'bg-emerald-500/40 font-bold') : ''
          }
        >
          {part.value}
        </span>
      )
    })
  }

  return (
    <ToolLayout title={tool.name} description={tool.description} icon={tool.icon}>
      <div className="space-y-6">
        <div className="border-border bg-card flex flex-col items-center justify-between gap-4 rounded-xl border p-4 sm:flex-row">
          <div className="flex flex-wrap items-center gap-4">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'split' | 'unified')}>
              <TabsList className="bg-secondary h-9">
                <TabsTrigger value="split" className="text-xs">
                  Split View
                </TabsTrigger>
                <TabsTrigger value="unified" className="text-xs">
                  Unified View
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              variant="ghost"
              size="sm"
              onClick={swapText}
              className="text-muted-foreground h-9 gap-1.5 text-xs"
            >
              <ArrowRightLeft className="h-3.5 w-3.5" /> Swap
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch checked={ignoreCase} onCheckedChange={setIgnoreCase} id="case-toggle" />
              <Label htmlFor="case-toggle" className="text-muted-foreground text-xs">
                Ignore Case
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={ignoreWhitespace}
                onCheckedChange={setIgnoreWhitespace}
                id="ws-toggle"
              />
              <Label htmlFor="ws-toggle" className="text-muted-foreground text-xs">
                Ignore Whitespace
              </Label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyPatch}
              className="text-muted-foreground dark:hover:text-foreground ml-2 h-8 gap-1 text-xs hover:text-white"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              Copy Patch
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-muted-foreground px-1 text-xs font-semibold tracking-wider uppercase">
              Original Text
            </Label>
            <textarea
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              className="border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:ring-ring h-[200px] w-full resize-none rounded-lg border p-4 font-mono text-xs leading-relaxed whitespace-pre focus:ring-1 focus:outline-none"
              spellCheck={false}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground px-1 text-xs font-semibold tracking-wider uppercase">
              Modified Text
            </Label>
            <textarea
              value={modified}
              onChange={(e) => setModified(e.target.value)}
              className="border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:ring-ring h-[200px] w-full resize-none rounded-lg border p-4 font-mono text-xs leading-relaxed whitespace-pre focus:ring-1 focus:outline-none"
              spellCheck={false}
            />
          </div>
        </div>

        <div className="border-border bg-card flex h-[500px] flex-col overflow-hidden rounded-xl border">
          <div className="bg-secondary/50 border-border flex items-center justify-between border-b px-4 py-2">
            <Label className="text-foreground text-xs font-semibold">Diff Result</Label>
            <div className="flex items-center gap-4 font-mono text-[10px]">
              <span className="rounded bg-emerald-500/10 px-1.5 text-emerald-500">
                {numAdded} added
              </span>
              <span className="rounded bg-rose-500/10 px-1.5 text-rose-500">
                {numRemoved} removed
              </span>
              <span className="text-muted-foreground">{numChanges} total changes</span>
            </div>
          </div>

          <div className="bg-background flex-1 overflow-auto pb-4 font-mono text-xs leading-relaxed">
            <table className="w-full border-collapse">
              <tbody>
                {diffResult.map((part, i) => {
                  const lines = (part.value as string).replace(/n$/, '').split('n')
                  return lines.map((line, j) => {
                    const bgColor = part.added
                      ? 'bg-emerald-500/15'
                      : part.removed
                        ? 'bg-rose-500/15'
                        : 'hover:bg-secondary/30'
                    const textColor = part.added
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : part.removed
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-foreground'
                    const sign = part.added ? '+' : part.removed ? '-' : ' '
                    return (
                      <tr key={`${i}-${j}`} className={`${bgColor} ${textColor}`}>
                        <td className="border-border bg-secondary/20 w-8 border-r text-center opacity-50 select-none">
                          {!part.added && i + j + 1}
                        </td>
                        <td className="border-border bg-secondary/20 w-8 border-r text-center opacity-50 select-none">
                          {!part.removed && i + j + 1}
                        </td>
                        <td className="w-6 text-center opacity-50 select-none">{sign}</td>
                        <td className="pr-4 break-all whitespace-pre">{line || ' '}</td>
                      </tr>
                    )
                  })
                })}
              </tbody>
            </table>
            <div className="divide-border grid h-full grid-cols-2 divide-x">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <tbody>
                    {diffResult.map((part, _i) => {
                      if (part.added) return null

                      return null
                    })}
                    {(() => {
                      let leftLine = 1
                      const rows = []
                      for (let i = 0; i < diffResult.length; i++) {
                        const part = diffResult[i]
                        const lines = (part.value as string).replace(/n$/, '').split('n')

                        if (part.removed && diffResult[i + 1]?.added) {
                          const nextPart = diffResult[i + 1]
                          const addedLines = (nextPart.value as string).replace(/n$/, '').split('n')
                          const maxLines = Math.max(lines.length, addedLines.length)

                          for (let j = 0; j < maxLines; j++) {
                            const lLineStr = lines[j] !== undefined ? lines[j] : null
                            const rLineStr = addedLines[j] !== undefined ? addedLines[j] : null

                            rows.push(
                              <tr key={`mod-${i}-${j}`}>
                                <td className="border-border w-8 border-r bg-rose-500/10 text-center text-rose-500 opacity-50 select-none">
                                  {lLineStr !== null ? leftLine++ : ''}
                                </td>
                                <td
                                  className={`px-2 break-all whitespace-pre ${lLineStr !== null ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' : 'bg-secondary/10'}`}
                                >
                                  {lLineStr !== null && rLineStr !== null
                                    ? getInlineDiff(lLineStr, rLineStr, true)
                                    : lLineStr || ' '}
                                </td>
                              </tr>,
                            )
                          }
                          i++
                        } else if (part.removed) {
                          for (let j = 0; j < lines.length; j++) {
                            rows.push(
                              <tr key={`rem-${i}-${j}`}>
                                <td className="border-border w-8 border-r bg-rose-500/10 text-center text-rose-500 opacity-50 select-none">
                                  {leftLine++}
                                </td>
                                <td className="bg-rose-500/15 px-2 break-all whitespace-pre text-rose-600 dark:text-rose-400">
                                  {lines[j] || ' '}
                                </td>
                              </tr>,
                            )
                          }
                        } else if (part.added) {
                          for (let j = 0; j < lines.length; j++) {
                            rows.push(
                              <tr key={`add-l-${i}-${j}`}>
                                <td className="border-border bg-secondary/10 w-8 border-r text-center opacity-10 select-none"></td>
                                <td className="bg-secondary/5 px-2 break-all whitespace-pre"> </td>
                              </tr>,
                            )
                          }
                        } else {
                          for (let j = 0; j < lines.length; j++) {
                            rows.push(
                              <tr key={`unc-${i}-${j}`}>
                                <td className="border-border bg-secondary/10 w-8 border-r text-center opacity-50 select-none">
                                  {leftLine++}
                                </td>
                                <td className="text-muted-foreground px-2 break-all whitespace-pre">
                                  {lines[j] || ' '}
                                </td>
                              </tr>,
                            )
                          }
                        }
                      }
                      return rows
                    })()}
                  </tbody>
                </table>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <tbody>
                    {(() => {
                      let rightLine = 1
                      const rows = []
                      for (let i = 0; i < diffResult.length; i++) {
                        const part = diffResult[i]
                        const lines = (part.value as string).replace(/n$/, '').split('n')

                        if (part.removed && diffResult[i + 1]?.added) {
                          const nextPart = diffResult[i + 1]
                          const addedLines = (nextPart.value as string).replace(/n$/, '').split('n')
                          const maxLines = Math.max(lines.length, addedLines.length)

                          for (let j = 0; j < maxLines; j++) {
                            const lLineStr = lines[j] !== undefined ? lines[j] : null
                            const rLineStr = addedLines[j] !== undefined ? addedLines[j] : null

                            rows.push(
                              <tr key={`rmod-${i}-${j}`}>
                                <td className="border-border w-8 border-r bg-emerald-500/10 text-center text-emerald-500 opacity-50 select-none">
                                  {rLineStr !== null ? rightLine++ : ''}
                                </td>
                                <td
                                  className={`px-2 break-all whitespace-pre ${rLineStr !== null ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-secondary/10'}`}
                                >
                                  {lLineStr !== null && rLineStr !== null
                                    ? getInlineDiff(lLineStr, rLineStr, false)
                                    : rLineStr || ' '}
                                </td>
                              </tr>,
                            )
                          }
                          i++
                        } else if (part.removed) {
                          for (let j = 0; j < lines.length; j++) {
                            rows.push(
                              <tr key={`rrem-${i}-${j}`}>
                                <td className="border-border bg-secondary/10 w-8 border-r text-center opacity-10 select-none"></td>
                                <td className="bg-secondary/5 px-2 break-all whitespace-pre"> </td>
                              </tr>,
                            )
                          }
                        } else if (part.added) {
                          for (let j = 0; j < lines.length; j++) {
                            rows.push(
                              <tr key={`radd-${i}-${j}`}>
                                <td className="border-border w-8 border-r bg-emerald-500/10 text-center text-emerald-500 opacity-50 select-none">
                                  {rightLine++}
                                </td>
                                <td className="bg-emerald-500/15 px-2 break-all whitespace-pre text-emerald-600 dark:text-emerald-400">
                                  {lines[j] || ' '}
                                </td>
                              </tr>,
                            )
                          }
                        } else {
                          for (let j = 0; j < lines.length; j++) {
                            rows.push(
                              <tr key={`runc-${i}-${j}`}>
                                <td className="border-border bg-secondary/10 w-8 border-r text-center opacity-50 select-none">
                                  {rightLine++}
                                </td>
                                <td className="text-muted-foreground px-2 break-all whitespace-pre">
                                  {lines[j] || ' '}
                                </td>
                              </tr>,
                            )
                          }
                        }
                      }
                      return rows
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
