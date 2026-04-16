'use client'

import { useState, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { useTheme } from 'next-themes'
import { format, SqlLanguage } from 'sql-formatter'
import {
  Database,
  Copy,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Maximize2,
  ChevronRight,
  ChevronDown,
  Layers,
  Code2,
  ListTree,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToolLayout } from '@/components/tool-layout'
import { useCopyToClipboard } from '@/hooks/use-copy'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { analyzeSQL, SQLAnalysis, SQL_DIALECTS, SQLDialect } from '@/lib/sql-analyzer-utils'
import { cn } from '@/lib/utils'

const SQL_TOOL_METADATA = {
  id: 'sql-analyzer',
  name: 'SQL Analyzer',
  description:
    'Powerful SQL analysis and formatting toolkit. Visualize query structure, analyze table dependencies, calculate complexity, and detect anti-patterns in your SQL queries.',
  icon: Database,
}

export default function SQLAnalyzerTool() {
  const [input, setInput] = useState('')
  const [mounted, setMounted] = useState(false)
  const [analysis, setAnalysis] = useState<SQLAnalysis | null>(null)
  const [error, setError] = useState('')
  const [isFormatting, setIsFormatting] = useState(false)
  const [dialect, setDialect] = useState<SQLDialect>('postgresql')
  const copyToClipboard = useCopyToClipboard()
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleFormat = () => {
    if (!input.trim()) return
    setIsFormatting(true)
    try {
      const formatDialectMap: Record<SQLDialect, SqlLanguage> = {
        mysql: 'mysql',
        postgresql: 'postgresql',
        mariadb: 'mariadb',
        sqlite: 'sqlite',
        sqlserver: 'tsql',
        oracle: 'plsql',
      }
      const formatted = format(input, {
        language: formatDialectMap[dialect] || 'postgresql',
      })
      setInput(formatted)
      setError('')
    } catch (e) {
      setError(`Format Error: ${(e as Error).message}`)
    } finally {
      setIsFormatting(false)
    }
  }

  const handleAnalyze = () => {
    if (!input.trim()) return
    setError('')
    try {
      const result = analyzeSQL(input, dialect)
      setAnalysis(result)
    } catch (e) {
      setError(`Analysis Error: ${(e as Error).message}`)
      setAnalysis(null)
    }
  }

  const handleCopy = (text: string) => {
    void copyToClipboard(text)
    setCopiedText(text)
    setTimeout(() => setCopiedText(null), 2000)
  }

  if (!mounted) {
    return (
      <ToolLayout
        title={SQL_TOOL_METADATA.name}
        description={SQL_TOOL_METADATA.description}
        icon={SQL_TOOL_METADATA.icon}
      >
        <div className="flex h-[400px] items-center justify-center rounded-xl border border-dashed p-8">
          <div className="flex flex-col items-center gap-2">
            <Database className="h-8 w-8 animate-pulse opacity-20" />
            <p className="text-muted-foreground text-sm">Loading SQL Analyzer...</p>
          </div>
        </div>
      </ToolLayout>
    )
  }

  return (
    <ToolLayout
      title={SQL_TOOL_METADATA.name}
      description={SQL_TOOL_METADATA.description}
      icon={SQL_TOOL_METADATA.icon}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="bg-card border-border flex flex-col gap-3 rounded-xl border px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold">
              <Database className="text-primary h-4 w-4" />
              SQL Editor
            </h2>
            <div className="flex items-end justify-end gap-3">
              <Select value={dialect} onValueChange={(v) => setDialect(v as SQLDialect)}>
                <SelectTrigger size="sm" className="h-8 w-[140px] text-xs font-medium focus:ring-1">
                  <SelectValue placeholder="Select dialect" />
                </SelectTrigger>
                <SelectContent>
                  {SQL_DIALECTS.map((d) => (
                    <SelectItem key={d.id} value={d.id} className="text-xs">
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="destructive"
                size="sm"
                className="hover:bg-destructive h-8 gap-1.5 px-3 text-xs font-medium shadow-sm transition-all hover:text-white"
                onClick={() => setInput('')}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </Button>
            </div>
          </div>

          <div className="border-border bg-secondary/20 relative h-[400px] w-full overflow-hidden rounded-xl border shadow-sm">
            <Editor
              height="100%"
              language="sql"
              value={input}
              theme={resolvedTheme === 'dark' ? 'vs-dark' : 'light'}
              onChange={(v) => setInput(v || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                automaticLayout: true,
                fontFamily: 'JetBrains Mono, Menlo, Courier New, monospace',
              }}
            />
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row">
            <Button
              onClick={handleFormat}
              variant="secondary"
              className="h-11 flex-1 gap-2 border shadow-sm"
              disabled={isFormatting || !input.trim()}
            >
              <Layers className="h-4 w-4" />
              {isFormatting ? 'Formatting...' : 'Format SQL'}
            </Button>
            <Button
              onClick={handleAnalyze}
              className="h-11 flex-1 gap-2 shadow-sm"
              disabled={!input.trim()}
            >
              <Zap className="h-4 w-4" />
              Analyze Query
            </Button>
          </div>

          {error && (
            <div className="border-destructive/30 bg-destructive/10 text-destructive mt-2 flex items-start gap-3 rounded-lg border p-4 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="font-mono">{error}</p>
            </div>
          )}
        </div>
        {analysis && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-foreground flex items-center gap-2 text-sm font-semibold">
                <Code2 className="text-primary h-4 w-4" />
                Analysis Results
              </h2>
            </div>

            <Tabs defaultValue="structure" className="flex flex-col gap-4">
              <TabsList className="bg-secondary/50 border-border grid w-full grid-cols-4 justify-start rounded-lg border p-1 sm:flex sm:flex-wrap">
                <TabsTrigger value="structure" className="gap-2 text-xs">
                  <ListTree className="hidden h-3.5 w-3.5 sm:block" />
                  Structure
                </TabsTrigger>
                <TabsTrigger value="dependencies" className="gap-2 text-xs">
                  <Code2 className="hidden h-3.5 w-3.5 sm:block" />
                  Dependencies
                </TabsTrigger>
                <TabsTrigger value="analysis" className="gap-2 text-xs">
                  <Zap className="hidden h-3.5 w-3.5 sm:block" />
                  Insights
                </TabsTrigger>
                <TabsTrigger value="subqueries" className="gap-2 text-xs">
                  <Maximize2 className="hidden h-3.5 w-3.5 sm:block" />
                  Subqueries
                </TabsTrigger>
              </TabsList>

              <div className="border-border bg-card min-h-[400px] overflow-hidden rounded-xl border transition-all">
                <TabsContent
                  value="structure"
                  className="relative m-0 h-[400px] overflow-y-auto p-4 focus-visible:outline-none"
                >
                  <div className="absolute top-4 right-4 z-10">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border bg-secondary/50 text-muted-foreground flex h-9 items-center justify-center gap-1.5 p-0 shadow-sm backdrop-blur-sm transition-all hover:text-white sm:w-auto sm:px-3"
                      onClick={() => handleCopy(JSON.stringify(analysis.ast, null, 2))}
                    >
                      {copiedText === JSON.stringify(analysis.ast, null, 2) ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="hidden sm:inline">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span className="hidden sm:inline">Copy JSON</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <ASTTree node={analysis.ast} />
                </TabsContent>

                <TabsContent
                  value="dependencies"
                  className="m-0 h-[400px] overflow-y-auto p-4 focus-visible:outline-none"
                >
                  <div className="space-y-6">
                    <section>
                      <h3 className="text-primary mb-3 text-xs font-bold tracking-wider uppercase">
                        Tables Detected
                      </h3>
                      <div className="flex flex-wrap gap-2 pr-12">
                        {analysis.tables.length > 0 ? (
                          analysis.tables.map((t) => (
                            <span
                              key={t}
                              className="border-border bg-secondary/50 rounded-md border px-2.5 py-1.5 font-mono text-sm shadow-sm"
                            >
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm italic">
                            None detected
                          </span>
                        )}
                      </div>
                    </section>

                    <section>
                      <h3 className="text-primary mb-3 text-xs font-bold tracking-wider uppercase">
                        Columns Selected
                      </h3>
                      <div className="flex flex-wrap gap-2 pr-12">
                        {analysis.columns.length > 0 ? (
                          analysis.columns.map((c) => (
                            <span
                              key={c}
                              className="border-border bg-secondary/50 rounded-md border px-2.5 py-1.5 font-mono text-sm shadow-sm"
                            >
                              {c}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm italic">
                            None explicitly selected or wildcard used
                          </span>
                        )}
                      </div>
                    </section>
                  </div>
                </TabsContent>

                <TabsContent
                  value="analysis"
                  className="m-0 h-[400px] overflow-y-auto p-4 focus-visible:outline-none"
                >
                  <div className="space-y-6">
                    <div className="border-border bg-secondary/30 rounded-lg border p-4 shadow-sm">
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-sm font-medium">Complexity Score</span>
                        <span
                          className={cn(
                            'rounded-md px-2.5 py-1 font-mono text-xs font-bold tracking-wider',
                            analysis.complexity.score > 7
                              ? 'bg-red-500/20 text-red-500'
                              : analysis.complexity.score > 4
                                ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-500'
                                : 'bg-green-500/20 text-green-600 dark:text-green-500',
                          )}
                        >
                          {analysis.complexity.score}/10
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {analysis.complexity.details.map((d, i) => (
                          <div
                            key={i}
                            className="text-muted-foreground flex items-center gap-2 text-xs"
                          >
                            <div className="bg-primary h-1.5 w-1.5 shrink-0 rounded-full" />
                            {d}
                          </div>
                        ))}
                      </div>
                    </div>

                    <section>
                      <h3 className="text-primary mb-3 text-xs font-bold tracking-wider uppercase">
                        Explanation
                      </h3>
                      <div className="space-y-2">
                        {analysis.explanation.map((exp, idx) => (
                          <div
                            key={idx}
                            className="bg-secondary/40 border-border text-foreground/90 rounded-lg border p-3 text-sm leading-relaxed shadow-sm"
                          >
                            {exp}
                          </div>
                        ))}
                      </div>
                    </section>

                    {analysis.antiPatterns.length > 0 && (
                      <section>
                        <h3 className="mb-3 text-xs font-bold tracking-wider text-red-500 uppercase">
                          Anti-Patterns Detected
                        </h3>
                        <div className="space-y-2">
                          {analysis.antiPatterns.map((ap, i) => (
                            <div
                              key={i}
                              className={cn(
                                'flex gap-3 rounded-lg border p-3 text-sm shadow-sm',
                                ap.severity === 'high'
                                  ? 'border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-500'
                                  : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-700 dark:text-yellow-500',
                              )}
                            >
                              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                              <span className="leading-relaxed">{ap.message}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                </TabsContent>

                <TabsContent
                  value="subqueries"
                  className="m-0 h-[400px] overflow-y-auto p-4 focus-visible:outline-none"
                >
                  <div className="space-y-4">
                    {analysis.subqueries.length > 0 ? (
                      analysis.subqueries.map((sq, i) => (
                        <div
                          key={i}
                          className="border-border bg-secondary/30 group relative rounded-lg border p-4 shadow-sm"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="bg-primary/20 text-primary border-primary/20 rounded border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase">
                              Level {sq.level}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-border bg-secondary/50 text-muted-foreground flex h-8 items-center justify-center gap-1.5 p-0 shadow-sm backdrop-blur-sm transition-all hover:text-white sm:w-auto sm:px-2"
                              onClick={() => handleCopy(sq.sql)}
                            >
                              {copiedText === sq.sql ? (
                                <>
                                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                                  <span className="hidden sm:inline">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Copy</span>
                                </>
                              )}
                            </Button>
                          </div>
                          <pre className="text-foreground/80 overflow-x-auto font-mono text-xs leading-relaxed">
                            {sq.sql}
                          </pre>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted-foreground bg-secondary/20 border-border flex h-32 flex-col items-center justify-center rounded-lg border border-dashed text-center">
                        <p className="text-sm italic">No nested subqueries detected in the AST.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}

function ASTTree({
  node,
  label,
  depth = 0,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  node: any
  label?: string
  depth?: number
}) {
  const [isOpen, setIsOpen] = useState(depth < 2)

  if (!node || typeof node !== 'object') {
    return (
      <div className={cn('my-1.5 ml-4 flex items-center gap-2', depth === 0 && 'ml-0')}>
        {label && <span className="text-muted-foreground font-mono text-xs">{label}:</span>}
        <span className="text-primary bg-primary/10 rounded px-1 font-mono text-xs">
          {String(node)}
        </span>
      </div>
    )
  }

  const isArray = Array.isArray(node)
  const children = Object.entries(node as Record<string, unknown>).filter(([k]) => k !== '_sql')

  return (
    <div className={cn('border-border/50 ml-4 border-l', depth === 0 && 'ml-0 border-none')}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hover:bg-secondary/80 flex w-full items-center gap-2 rounded px-1.5 py-1.5 transition-colors focus:outline-none"
      >
        {children.length > 0 ? (
          isOpen ? (
            <ChevronDown className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
          ) : (
            <ChevronRight className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
          )
        ) : (
          <div className="w-3.5 shrink-0" />
        )}
        <span className="text-foreground font-mono text-xs font-bold">
          {label ? <span className="text-muted-foreground font-normal">{label}: </span> : ''}
          {isArray ? `Array(${node.length})` : node.type || 'Object'}
        </span>
      </button>

      {isOpen && children.length > 0 && (
        <div className="mt-1">
          {children.map(([key, val]) => (
            <ASTTree key={key} node={val} label={key} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}
