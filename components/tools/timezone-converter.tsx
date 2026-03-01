'use client'

import { useState, useMemo } from 'react'
import { Globe, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToolLayout, OutputBox } from '@/components/tool-layout'

const TIMEZONES = [
  { label: 'UTC', value: 'UTC' },
  { label: 'US/Eastern (ET)', value: 'America/New_York' },
  { label: 'US/Central (CT)', value: 'America/Chicago' },
  { label: 'US/Mountain (MT)', value: 'America/Denver' },
  { label: 'US/Pacific (PT)', value: 'America/Los_Angeles' },
  { label: 'London (GMT/BST)', value: 'Europe/London' },
  { label: 'Paris (CET/CEST)', value: 'Europe/Paris' },
  { label: 'Berlin (CET/CEST)', value: 'Europe/Berlin' },
  { label: 'Moscow (MSK)', value: 'Europe/Moscow' },
  { label: 'Dubai (GST)', value: 'Asia/Dubai' },
  { label: 'India (IST)', value: 'Asia/Kolkata' },
  { label: 'Bangkok (ICT)', value: 'Asia/Bangkok' },
  { label: 'Singapore (SGT)', value: 'Asia/Singapore' },
  { label: 'Hong Kong (HKT)', value: 'Asia/Hong_Kong' },
  { label: 'Tokyo (JST)', value: 'Asia/Tokyo' },
  { label: 'Seoul (KST)', value: 'Asia/Seoul' },
  { label: 'Sydney (AEST)', value: 'Australia/Sydney' },
  { label: 'Auckland (NZST)', value: 'Pacific/Auckland' },
]

function formatInTimezone(date: Date, tz: string): string {
  try {
    return date.toLocaleString('en-US', {
      timeZone: tz,
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'short',
    })
  } catch {
    return 'Invalid timezone'
  }
}

function getUtcOffset(tz: string, date: Date): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'longOffset',
    })
    const parts = formatter.formatToParts(date)
    const offsetPart = parts.find((p) => p.type === 'timeZoneName')
    return offsetPart?.value ?? ''
  } catch {
    return ''
  }
}

export default function TimezoneConverterTool() {
  const [dateInput, setDateInput] = useState('')
  const [fromTz, setFromTz] = useState('UTC')
  const [toTzList, setToTzList] = useState([
    'America/New_York',
    'Europe/London',
    'Asia/Tokyo',
    'Asia/Bangkok',
  ])

  const parsedDate = useMemo(() => {
    if (!dateInput) return new Date()
    const d = new Date(dateInput)
    return isNaN(d.getTime()) ? null : d
  }, [dateInput])

  const sourceDate = useMemo(() => {
    if (!parsedDate) return null
    // We parse as if the user entered the time in fromTz
    // Create date string in the from-timezone and re-interpret
    if (!dateInput) return parsedDate
    try {
      const formatted = parsedDate.toLocaleString('en-US', { timeZone: fromTz })
      const localDate = new Date(formatted)
      const diff = parsedDate.getTime() - localDate.getTime()
      return new Date(parsedDate.getTime() + diff)
    } catch {
      return parsedDate
    }
  }, [parsedDate, fromTz, dateInput])

  const toggleTargetTz = (tz: string) => {
    setToTzList((prev) => (prev.includes(tz) ? prev.filter((t) => t !== tz) : [...prev, tz]))
  }

  const selectClass =
    'w-full rounded-lg border border-border bg-secondary/50 px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring'

  return (
    <ToolLayout
      title="Timezone Converter"
      description="Convert times between different timezones around the world"
      icon={Globe}
    >
      {/* Source */}
      <div className="border-border bg-card rounded-lg border p-5">
        <h3 className="text-foreground mb-4 text-sm font-semibold">Source Time</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className="text-muted-foreground text-xs">Date & Time</Label>
            <Input
              type="datetime-local"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              className="bg-secondary border-border text-foreground mt-1 font-mono"
            />
            <p className="text-muted-foreground mt-1 text-[11px]">Leave empty for current time</p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs">Source Timezone</Label>
            <select
              value={fromTz}
              onChange={(e) => setFromTz(e.target.value)}
              className={selectClass + ' mt-1'}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value} className="bg-card text-foreground">
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {sourceDate && (
          <div className="bg-secondary/50 mt-4 flex items-center gap-3 rounded-lg px-4 py-3">
            <span className="text-muted-foreground text-xs">Source:</span>
            <span className="text-primary font-mono text-sm font-medium">
              {formatInTimezone(sourceDate, fromTz)}
            </span>
          </div>
        )}
      </div>

      {/* Target Timezones */}
      <div className="border-border bg-card rounded-lg border p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-foreground text-sm font-semibold">Target Timezones</h3>
          <span className="text-muted-foreground text-xs">{toTzList.length} selected</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TIMEZONES.map((tz) => (
            <button
              key={tz.value}
              onClick={() => toggleTargetTz(tz.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                toTzList.includes(tz.value)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {tz.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {sourceDate && toTzList.length > 0 && (
        <div className="border-border bg-card overflow-hidden rounded-lg border">
          <div className="border-border bg-secondary/30 border-b px-5 py-3">
            <p className="text-foreground text-xs font-semibold">Converted Times</p>
          </div>
          <div className="divide-border/50 divide-y">
            {toTzList.map((tz) => {
              const tzInfo = TIMEZONES.find((t) => t.value === tz)
              return (
                <div
                  key={tz}
                  className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-center sm:gap-4"
                >
                  <div className="shrink-0 sm:w-48">
                    <p className="text-foreground text-xs font-semibold">{tzInfo?.label ?? tz}</p>
                    <p className="text-muted-foreground font-mono text-[11px]">
                      {getUtcOffset(tz, sourceDate)}
                    </p>
                  </div>
                  <ArrowRight className="text-muted-foreground hidden h-3.5 w-3.5 shrink-0 sm:block" />
                  <p className="text-primary flex-1 font-mono text-sm">
                    {formatInTimezone(sourceDate, tz)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
