'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { Globe, ArrowRight, ChevronDown, Clock, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToolLayout } from '@/components/tool-layout'

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
    return parts.find((p) => p.type === 'timeZoneName')?.value ?? ''
  } catch {
    return ''
  }
}

function buildSourceDate(date: Date, timeInput: string, fromTz: string): Date {
  try {
    const [hours, minutes, seconds] = timeInput.split(':').map(Number)
    const fullDate = new Date(date)
    fullDate.setHours(hours || 0, minutes || 0, seconds || 0, 0)
    const formatted = fullDate.toLocaleString('en-US', { timeZone: fromTz })
    const diff = fullDate.getTime() - new Date(formatted).getTime()
    return new Date(fullDate.getTime() + diff)
  } catch {
    return date
  }
}

export default function TimezoneConverterTool() {
  const [date, setDate] = useState<Date>(new Date())
  const [timeInput, setTimeInput] = useState(format(new Date(), 'HH:mm:ss'))
  const [fromTz, setFromTz] = useState('UTC')
  const [toTzList, setToTzList] = useState([
    'America/New_York',
    'Europe/London',
    'Asia/Tokyo',
    'Asia/Bangkok',
  ])
  const [calendarOpen, setCalendarOpen] = useState(false)

  const sourceDate = useMemo(
    () => buildSourceDate(date, timeInput, fromTz),
    [date, timeInput, fromTz],
  )

  const toggleTargetTz = (tz: string) =>
    setToTzList((prev) => (prev.includes(tz) ? prev.filter((t) => t !== tz) : [...prev, tz]))

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  const minutesSeconds = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

  const [hh, mm, ss] = timeInput.split(':')

  const updateTime = (part: 'hh' | 'mm' | 'ss', value: string) => {
    const parts = { hh, mm, ss }
    parts[part] = value
    setTimeInput(`${parts.hh}:${parts.mm}:${parts.ss}`)
  }

  return (
    <ToolLayout
      title="Timezone Converter"
      description="Convert times between different timezones around the world"
      icon={Globe}
    >
      <div className="border-border bg-card space-y-5 rounded-lg border p-5">
        <h3 className="text-foreground text-sm font-semibold">Source Time</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
              <CalendarDays className="h-3.5 w-3.5" />
              Date
            </label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="bg-secondary border-border hover:bg-secondary/80 hover:text-muted-foreground h-9 w-full justify-between font-mono text-xs font-normal"
                >
                  {format(date, 'PPP')}
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  captionLayout="dropdown"
                  defaultMonth={date}
                  onSelect={(newDate) => {
                    if (newDate) setDate(newDate)
                    setCalendarOpen(false)
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <label className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
              <Clock className="h-3.5 w-3.5" />
              Time
            </label>
            <div className="flex items-center gap-1">
              {(['hh', 'mm', 'ss'] as const).map((part, idx) => {
                const options = part === 'hh' ? hours : minutesSeconds
                const value = part === 'hh' ? hh : part === 'mm' ? mm : ss
                return (
                  <div key={part} className="flex flex-1 items-center gap-1">
                    <Select value={value} onValueChange={(v) => updateTime(part, v)}>
                      <SelectTrigger className="bg-secondary border-border h-9 text-center font-mono text-xs tabular-nums">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-48 font-mono text-xs">
                        {options.map((opt) => (
                          <SelectItem key={opt} value={opt} className="text-xs tabular-nums">
                            {opt}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {idx < 2 && (
                      <span className="text-muted-foreground flex w-full justify-center text-sm font-bold select-none">
                        :
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
            <Globe className="h-3.5 w-3.5" />
            Source Timezone
          </label>
          <Select value={fromTz} onValueChange={setFromTz}>
            <SelectTrigger className="bg-secondary border-border h-9 min-w-full text-xs md:min-w-xs">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value} className="text-xs">
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-secondary/50 flex items-center gap-3 rounded-lg px-4 py-3">
          <span className="text-muted-foreground shrink-0 text-xs">Source:</span>
          <span className="text-primary truncate font-mono text-sm font-medium">
            {formatInTimezone(sourceDate, fromTz)}
          </span>
        </div>
      </div>

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
                  : 'bg-secondary text-muted-foreground dark:hover:text-foreground hover:text-foreground'
              }`}
            >
              {tz.label}
            </button>
          ))}
        </div>
      </div>

      {toTzList.length > 0 && (
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
