'use client'

import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToolLayout, OutputBox } from '@/components/tool-layout'

export default function TimestampConverterTool() {
  const [now, setNow] = useState(Date.now())
  const [unixInput, setUnixInput] = useState('')
  const [dateInput, setDateInput] = useState('')
  const [fromUnix, setFromUnix] = useState<{
    iso: string
    local: string
    utc: string
    relative: string
  } | null>(null)
  const [fromDate, setFromDate] = useState<{ unix: string; unixMs: string } | null>(null)

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const convertFromUnix = () => {
    let ts = Number(unixInput)
    if (!ts || isNaN(ts)) return
    if (ts < 1e12) ts *= 1000
    const d = new Date(ts)
    if (isNaN(d.getTime())) return
    const diff = Date.now() - ts
    const absDiff = Math.abs(diff)
    let relative = ''
    if (absDiff < 60000) relative = 'just now'
    else if (absDiff < 3600000)
      relative = `${Math.floor(absDiff / 60000)} minutes ${diff > 0 ? 'ago' : 'from now'}`
    else if (absDiff < 86400000)
      relative = `${Math.floor(absDiff / 3600000)} hours ${diff > 0 ? 'ago' : 'from now'}`
    else relative = `${Math.floor(absDiff / 86400000)} days ${diff > 0 ? 'ago' : 'from now'}`
    setFromUnix({
      iso: d.toISOString(),
      local: d.toLocaleString(),
      utc: d.toUTCString(),
      relative,
    })
  }

  const convertFromDate = () => {
    const d = new Date(dateInput)
    if (isNaN(d.getTime())) return
    setFromDate({
      unix: String(Math.floor(d.getTime() / 1000)),
      unixMs: String(d.getTime()),
    })
  }

  const nowSec = Math.floor(now / 1000)

  return (
    <ToolLayout
      title="Timestamp Converter"
      description="Convert between Unix timestamps and human-readable dates"
      icon={Clock}
    >
      {/* Live clock */}
      <div className="border-border bg-secondary/50 rounded-lg border px-5 py-4">
        <p className="text-muted-foreground mb-1 text-xs font-medium">Current Time</p>
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <span className="text-primary font-mono text-2xl font-bold">{nowSec}</span>
          <span className="text-muted-foreground text-sm">{new Date(now).toISOString()}</span>
        </div>
      </div>

      {/* Unix to Date */}
      <div className="border-border bg-card rounded-lg border p-5">
        <h3 className="text-foreground mb-4 text-sm font-semibold">Unix Timestamp to Date</h3>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Label htmlFor="unix-input" className="text-muted-foreground text-xs">
              Unix Timestamp (seconds or milliseconds)
            </Label>
            <Input
              id="unix-input"
              placeholder="e.g. 1700000000"
              value={unixInput}
              onChange={(e) => setUnixInput(e.target.value)}
              className="bg-secondary border-border text-foreground mt-1 font-mono"
            />
          </div>
          <Button
            onClick={convertFromUnix}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Convert
          </Button>
        </div>
        {fromUnix && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <OutputBox label="ISO 8601" value={fromUnix.iso} />
            <OutputBox label="Local" value={fromUnix.local} />
            <OutputBox label="UTC" value={fromUnix.utc} />
            <OutputBox label="Relative" value={fromUnix.relative} />
          </div>
        )}
      </div>

      {/* Date to Unix */}
      <div className="border-border bg-card rounded-lg border p-5">
        <h3 className="text-foreground mb-4 text-sm font-semibold">Date to Unix Timestamp</h3>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Label htmlFor="date-input" className="text-muted-foreground text-xs">
              Date String (ISO 8601 or natural)
            </Label>
            <Input
              id="date-input"
              type="datetime-local"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="bg-secondary border-border text-foreground mt-1 font-mono"
            />
          </div>
          <Button
            onClick={convertFromDate}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Convert
          </Button>
        </div>
        {fromDate && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <OutputBox label="Unix (seconds)" value={fromDate.unix} />
            <OutputBox label="Unix (milliseconds)" value={fromDate.unixMs} />
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
