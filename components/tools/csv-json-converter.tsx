'use client'

import { useState, useEffect } from 'react'
import { useCopyToClipboard } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Copy,
  CheckCircle2,
  ArrowRightLeft,
  FileJson,
  FileSpreadsheet,
  AlertTriangle,
  Download,
} from 'lucide-react'
import Papa from 'papaparse'
import { ToolLayout } from '@/components/tool-layout'
import { tools } from '@/lib/tools'

type Mode = 'csv2json' | 'json2csv'
type Delimiter = 'auto' | ',' | ';' | '\t' | '|'

const DELIMITERS: { label: string; value: Delimiter }[] = [
  { label: 'Auto', value: 'auto' },
  { label: 'Comma (,)', value: ',' },
  { label: 'Semicolon (;)', value: ';' },
  { label: 'Tab (\\t)', value: '\t' },
  { label: 'Pipe (|)', value: '|' },
]

const PLACEHOLDERS: Record<Mode, string> = {
  csv2json:
    'id,name,email,active\n1,John Doe,john@example.com,true\n2,Jane Smith,jane@example.com,false',
  json2csv:
    '[\n  {\n    "id": 1,\n    "name": "John Doe",\n    "email": "john@example.com",\n    "active": true\n  }\n]',
}

function convertCsvToJson(
  input: string,
  hasHeader: boolean,
  delimiter: Delimiter,
  dynamicTyping: boolean,
): { output: string; stats: { rows: number; cols: number }; error: string } {
  let output = ''
  let stats = { rows: 0, cols: 0 }
  let error = ''

  const results = Papa.parse(input, {
    header: hasHeader,
    delimiter: delimiter === 'auto' ? '' : delimiter,
    dynamicTyping,
    skipEmptyLines: true,
  })

  if (results.errors.length > 0 && results.data.length === 0) {
    error = results.errors[0].message
  } else {
    output = JSON.stringify(results.data, null, 2)
    const firstRow = results.data[0]
    stats = {
      rows: results.data.length,
      cols:
        hasHeader && firstRow
          ? Object.keys(firstRow as object).length
          : ((firstRow as unknown[])?.length ?? 0),
    }
  }

  return { output, stats, error }
}

function convertJsonToCsv(
  input: string,
  hasHeader: boolean,
  delimiter: Delimiter,
): { output: string; stats: { rows: number; cols: number }; error: string } {
  try {
    const json = JSON.parse(input)
    const csv = Papa.unparse(json, {
      delimiter: delimiter === 'auto' ? ',' : delimiter,
      header: hasHeader,
    })
    const parsed = Array.isArray(json) ? json : [json]
    return {
      output: csv,
      stats: {
        rows: parsed.length,
        cols: parsed.length > 0 ? Object.keys(parsed[0]).length : 0,
      },
      error: '',
    }
  } catch (err: unknown) {
    return {
      output: '',
      stats: { rows: 0, cols: 0 },
      error: err instanceof Error ? err.message : 'Invalid JSON input',
    }
  }
}

export default function CsvJsonConverter() {
  const tool = tools.find((t) => t.id === 'csv-json-converter')!
  const [mode, setMode] = useState<Mode>('csv2json')
  const [inputVal, setInputVal] = useState('')
  const [outputVal, setOutputVal] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [stats, setStats] = useState({ rows: 0, cols: 0 })
  const [hasHeader, setHasHeader] = useState(true)
  const [delimiter, setDelimiter] = useState<Delimiter>('auto')
  const [dynamicTyping, setDynamicTyping] = useState(true)
  const [copied, setCopied] = useState(false)
  const copyToClipboard = useCopyToClipboard()

  useEffect(() => {
    if (!inputVal.trim()) {
      setOutputVal('')
      setErrorMsg('')
      setStats({ rows: 0, cols: 0 })
      return
    }

    const result =
      mode === 'csv2json'
        ? convertCsvToJson(inputVal, hasHeader, delimiter, dynamicTyping)
        : convertJsonToCsv(inputVal, hasHeader, delimiter)

    setOutputVal(result.output)
    setErrorMsg(result.error)
    setStats(result.stats)
  }, [inputVal, mode, hasHeader, delimiter, dynamicTyping])

  const handleCopy = () => {
    if (!outputVal) return
    void copyToClipboard(outputVal)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!outputVal) return
    const isJson = mode === 'csv2json'
    const blob = new Blob([outputVal], {
      type: isJson ? 'application/json' : 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `converted-${Date.now()}.${isJson ? 'json' : 'csv'}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleMode = () => {
    setMode((prev) => (prev === 'csv2json' ? 'json2csv' : 'csv2json'))
    setInputVal(outputVal)
  }

  const inputLabel = mode === 'csv2json' ? 'CSV' : 'JSON'
  const outputLabel = mode === 'csv2json' ? 'JSON' : 'CSV'

  return (
    <ToolLayout title={tool.name} description={tool.description} icon={tool.icon}>
      <div className="space-y-6">
        <div className="border-border bg-card flex flex-col items-center justify-between gap-4 rounded-xl border p-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === 'csv2json'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4" /> CSV
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMode}
              className="hover:bg-secondary text-muted-foreground dark:hover:text-foreground hover:text-foreground h-8 w-8 rounded-full"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </Button>
            <div
              className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === 'json2csv'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground'
              }`}
            >
              <FileJson className="h-4 w-4" /> JSON
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch checked={hasHeader} onCheckedChange={setHasHeader} id="header-toggle" />
              <Label htmlFor="header-toggle" className="text-muted-foreground text-xs">
                Headers
              </Label>
            </div>
            {mode === 'csv2json' && (
              <div className="flex items-center space-x-2">
                <Switch
                  checked={dynamicTyping}
                  onCheckedChange={setDynamicTyping}
                  id="dynamic-toggle"
                />
                <Label htmlFor="dynamic-toggle" className="text-muted-foreground text-xs">
                  Parse Num/Bool
                </Label>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Label className="text-muted-foreground text-xs">Delimiter:</Label>
              <Select value={delimiter} onValueChange={(v) => setDelimiter(v as Delimiter)}>
                <SelectTrigger className="bg-secondary h-8 w-[110px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DELIMITERS.map((d) => (
                    <SelectItem key={d.value} value={d.value} className="text-xs">
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="border-destructive/40 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border px-4 py-3 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="flex h-full flex-col space-y-2">
            <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Input ({inputLabel})
            </Label>
            <textarea
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:ring-ring min-h-[400px] w-full flex-1 resize-none rounded-lg border p-4 font-mono text-xs leading-relaxed focus:ring-1 focus:outline-none"
              placeholder={PLACEHOLDERS[mode]}
            />
          </div>

          <div className="flex h-full flex-col space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
                Output ({outputLabel})
                {outputVal && (
                  <span className="text-muted-foreground ml-2 font-normal normal-case">
                    ({stats.rows} rows, {stats.cols} columns)
                  </span>
                )}
              </Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleCopy}
                  disabled={!outputVal}
                  className="border-border bg-secondary/50 text-muted-foreground flex h-9 items-center justify-center gap-1.5 p-0 hover:text-white sm:w-auto sm:px-3"
                >
                  {copied ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!outputVal}
                  className="h-7 gap-1 text-xs"
                >
                  <Download className="h-3 w-3" />
                  Download
                </Button>
              </div>
            </div>
            <div className="border-border bg-card relative min-h-[400px] flex-1 overflow-auto rounded-lg border p-4">
              {!outputVal && !errorMsg && (
                <div className="text-muted-foreground/50 absolute inset-0 flex items-center justify-center text-xs italic">
                  Awaiting valid input...
                </div>
              )}
              <pre className="text-foreground font-mono text-xs leading-relaxed">{outputVal}</pre>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
