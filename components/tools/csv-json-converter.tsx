'use client'

import { useState, useRef, useEffect } from 'react'
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
  Check,
  ArrowRightLeft,
  FileJson,
  FileSpreadsheet,
  AlertTriangle,
  Download,
} from 'lucide-react'

import Papa from 'papaparse'

export default function CsvJsonConverter() {
  const [mode, setMode] = useState<'csv2json' | 'json2csv'>('csv2json')

  const [inputVal, setInputVal] = useState('')
  const [outputVal, setOutputVal] = useState('')
  const [errorMSG, setErrorMSG] = useState('')
  const [stats, setStats] = useState({ rows: 0, cols: 0 })

  const [hasHeader, setHasHeader] = useState(true)
  const [delimiter, setDelimiter] = useState('')
  const [dynamicTyping, setDynamicTyping] = useState(true)

  const [copied, setCopied] = useState(false)
  const copyToClipboard = useCopyToClipboard()

  useEffect(() => {
    if (!inputVal.trim()) {
      setOutputVal('')
      setErrorMSG('')
      setStats({ rows: 0, cols: 0 })
      return
    }

    try {
      if (mode === 'csv2json') {
        Papa.parse(inputVal, {
          header: hasHeader,
          delimiter: delimiter === '' ? undefined : delimiter,
          dynamicTyping: dynamicTyping,
          skipEmptyLines: true,
          complete: (results: any) => {
            if (results.errors.length > 0 && results.data.length === 0) {
              setErrorMSG(results.errors[0].message)
              setOutputVal('')
            } else {
              setErrorMSG('')
              setOutputVal(JSON.stringify(results.data, null, 2))
              setStats({
                rows: results.data.length,
                cols:
                  hasHeader && results.data.length > 0
                    ? Object.keys(results.data[0]).length
                    : results.data[0]?.length || 0,
              })
            }
          },
          error: (err: any) => {
            setErrorMSG(err.message)
          },
        })
      } else {
        const json = JSON.parse(inputVal)
        const csv = Papa.unparse(json, {
          delimiter: delimiter === '' ? ',' : delimiter,
          header: hasHeader,
        })
        setOutputVal(csv)
        const parsed = Array.isArray(json) ? json : [json]
        setStats({
          rows: parsed.length,
          cols: parsed.length > 0 ? Object.keys(parsed[0]).length : 0,
        })
        setErrorMSG('')
      }
    } catch (err: any) {
      setErrorMSG(err.message || 'Invalid JSON input')
      setOutputVal('')
      setStats({ rows: 0, cols: 0 })
    }
  }, [inputVal, mode, hasHeader, delimiter, dynamicTyping])

  const copyOut = () => {
    if (!outputVal) return
    copyToClipboard(outputVal)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadFile = () => {
    if (!outputVal) return
    const blob = new Blob([outputVal], {
      type: mode === 'csv2json' ? 'application/json' : 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `converted-${Date.now()}.${mode === 'csv2json' ? 'json' : 'csv'}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleMode = () => {
    setMode((prev) => (prev === 'csv2json' ? 'json2csv' : 'csv2json'))
    setInputVal(outputVal)
  }

  // Pre-fill placeholder
  const placeholderIn =
    mode === 'csv2json'
      ? 'id,name,email,active\n1,John Doe,john@example.com,true\n2,Jane Smith,jane@example.com,false'
      : '[\n  {\n    "id": 1,\n    "name": "John Doe",\n    "email": "john@example.com",\n    "active": true\n  }\n]'

  return (
    <div className="space-y-6">
      <div className="border-border bg-card flex flex-col items-center justify-between gap-4 rounded-xl border p-4 sm:flex-row">
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${mode === 'csv2json' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
          >
            <FileSpreadsheet className="h-4 w-4" /> CSV
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleMode}
            className="hover:bg-secondary h-8 w-8 rounded-full"
          >
            <ArrowRightLeft className="h-4 w-4" />
          </Button>
          <div
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${mode === 'json2csv' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
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
            <Select value={delimiter} onValueChange={setDelimiter}>
              <SelectTrigger className="bg-secondary h-8 w-[100px] text-xs">
                <SelectValue placeholder="Auto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Auto</SelectItem>
                <SelectItem value=",">Comma (,)</SelectItem>
                <SelectItem value=";">Semicolon (;)</SelectItem>
                <SelectItem value="t">Tab (t)</SelectItem>
                <SelectItem value="|">Pipe (|)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {errorMSG && (
        <div className="border-destructive/40 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border px-4 py-3 text-xs">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {errorMSG}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="flex h-full flex-col space-y-2">
          <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
            Input ({mode === 'csv2json' ? 'CSV' : 'JSON'})
          </Label>
          <textarea
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:ring-ring min-h-[400px] w-full flex-1 resize-none rounded-lg border p-4 font-mono text-xs leading-relaxed focus:ring-1 focus:outline-none"
            placeholder={placeholderIn}
          />
        </div>

        <div className="flex h-full flex-col space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Output ({mode === 'csv2json' ? 'JSON' : 'CSV'})
              {outputVal && (
                <span className="text-muted-foreground ml-2 font-normal normal-case">
                  ({stats.rows} rows, {stats.cols} columns)
                </span>
              )}
            </Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={copyOut}
                disabled={!outputVal}
                className="h-7 gap-1 text-xs"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                Copy
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={downloadFile}
                disabled={!outputVal}
                className="h-7 gap-1 text-xs"
              >
                <Download className="h-3 w-3" />
                Download
              </Button>
            </div>
          </div>
          <div className="border-border bg-card relative min-h-[400px] flex-1 overflow-auto rounded-lg border p-4">
            {!outputVal && !errorMSG && (
              <div className="text-muted-foreground/50 absolute inset-0 flex items-center justify-center text-xs italic">
                Awaiting valid input...
              </div>
            )}
            <pre className="text-foreground font-mono text-xs leading-relaxed">{outputVal}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}
