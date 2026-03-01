'use client'

import { useState, useMemo } from 'react'
import { Clock, Info } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ToolLayout } from '@/components/tool-layout'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface FieldDescription {
  name: string
  allowed: string
  specials: string
}

const FIELDS: FieldDescription[] = [
  { name: 'Minute', allowed: '0-59', specials: '* , - /' },
  { name: 'Hour', allowed: '0-23', specials: '* , - /' },
  { name: 'Day of Month', allowed: '1-31', specials: '* , - / L W' },
  { name: 'Month', allowed: '1-12 or JAN-DEC', specials: '* , - /' },
  { name: 'Day of Week', allowed: '0-7 (0,7=Sun) or SUN-SAT', specials: '* , - / L #' },
]

function parseCronExpression(cron: string): string {
  const parts = cron.trim().split(/\s+/)
  if (parts.length < 5 || parts.length > 6) {
    return 'Invalid cron expression. Expected 5 fields: minute hour day-of-month month day-of-week'
  }

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts
  const desc: string[] = []

  // Seconds (if 6 parts)
  const hasSeconds = parts.length === 6

  // Minute
  if (minute === '*') {
    desc.push('every minute')
  } else if (minute.includes('/')) {
    const [, step] = minute.split('/')
    desc.push(`every ${step} minute${step !== '1' ? 's' : ''}`)
  } else if (minute.includes(',')) {
    desc.push(`at minute ${minute}`)
  } else if (minute.includes('-')) {
    const [start, end] = minute.split('-')
    desc.push(`every minute from ${start} through ${end}`)
  } else {
    desc.push(`at minute ${minute}`)
  }

  // Hour
  if (hour === '*') {
    desc.push('of every hour')
  } else if (hour.includes('/')) {
    const [, step] = hour.split('/')
    desc.push(`past every ${step} hour${step !== '1' ? 's' : ''}`)
  } else if (hour.includes(',')) {
    desc.push(`past hour ${hour}`)
  } else if (hour.includes('-')) {
    const [start, end] = hour.split('-')
    desc.push(`during hour ${start} through ${end}`)
  } else {
    const h = parseInt(hour, 10)
    const period = h >= 12 ? 'PM' : 'AM'
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    desc.push(`at ${h12} ${period}`)
  }

  // Day of Month
  if (dayOfMonth !== '*' && dayOfMonth !== '?') {
    if (dayOfMonth === 'L') {
      desc.push('on the last day of the month')
    } else if (dayOfMonth.includes('/')) {
      const [, step] = dayOfMonth.split('/')
      desc.push(`every ${step} day${step !== '1' ? 's' : ''} of the month`)
    } else if (dayOfMonth.includes(',')) {
      desc.push(`on day ${dayOfMonth} of the month`)
    } else {
      desc.push(`on day ${dayOfMonth} of the month`)
    }
  }

  // Month
  if (month !== '*') {
    if (month.includes(',')) {
      const months = month.split(',').map((m) => {
        const n = parseInt(m, 10)
        return isNaN(n) ? m : MONTH_NAMES[n - 1] || m
      })
      desc.push(`in ${months.join(', ')}`)
    } else if (month.includes('-')) {
      const [start, end] = month.split('-')
      const s = parseInt(start, 10)
      const e = parseInt(end, 10)
      desc.push(
        `in ${isNaN(s) ? start : MONTH_NAMES[s - 1]} through ${isNaN(e) ? end : MONTH_NAMES[e - 1]}`,
      )
    } else if (month.includes('/')) {
      const [, step] = month.split('/')
      desc.push(`every ${step} month${step !== '1' ? 's' : ''}`)
    } else {
      const n = parseInt(month, 10)
      desc.push(`in ${isNaN(n) ? month : MONTH_NAMES[n - 1] || month}`)
    }
  }

  // Day of Week
  if (dayOfWeek !== '*' && dayOfWeek !== '?') {
    if (dayOfWeek.includes(',')) {
      const days = dayOfWeek.split(',').map((d) => {
        const n = parseInt(d, 10)
        return isNaN(n) ? d : DAY_NAMES[n % 7] || d
      })
      desc.push(`on ${days.join(', ')}`)
    } else if (dayOfWeek.includes('-')) {
      const [start, end] = dayOfWeek.split('-')
      const s = parseInt(start, 10)
      const e = parseInt(end, 10)
      desc.push(
        `on ${isNaN(s) ? start : DAY_NAMES[s % 7]} through ${isNaN(e) ? end : DAY_NAMES[e % 7]}`,
      )
    } else {
      const n = parseInt(dayOfWeek, 10)
      desc.push(`on ${isNaN(n) ? dayOfWeek : DAY_NAMES[n % 7] || dayOfWeek}`)
    }
  }

  const prefix = hasSeconds ? `(with seconds field: ${parts[0]}) ` : ''
  return prefix + desc.join(' ')
}

function getNextRuns(cron: string, count: number = 5): Date[] {
  const parts = cron.trim().split(/\s+/)
  if (parts.length < 5) return []

  const [minuteStr, hourStr, domStr, monthStr, dowStr] = parts
  const now = new Date()
  const results: Date[] = []
  const d = new Date(now)
  d.setSeconds(0)
  d.setMilliseconds(0)
  d.setMinutes(d.getMinutes() + 1)

  const expandField = (field: string, min: number, max: number): number[] | null => {
    if (field === '*' || field === '?') return null
    const values = new Set<number>()
    for (const part of field.split(',')) {
      if (part.includes('/')) {
        const [range, stepStr] = part.split('/')
        const step = parseInt(stepStr, 10)
        const start = range === '*' ? min : parseInt(range, 10)
        for (let i = start; i <= max; i += step) values.add(i)
      } else if (part.includes('-')) {
        const [s, e] = part.split('-').map(Number)
        for (let i = s; i <= e; i++) values.add(i)
      } else {
        values.add(parseInt(part, 10))
      }
    }
    return [...values].sort((a, b) => a - b)
  }

  const minutes = expandField(minuteStr, 0, 59)
  const hours = expandField(hourStr, 0, 23)
  const doms = expandField(domStr, 1, 31)
  const months = expandField(monthStr, 1, 12)
  const dows = expandField(dowStr, 0, 6)

  let safety = 0
  while (results.length < count && safety < 525600) {
    safety++
    const m = d.getMinutes()
    const h = d.getHours()
    const dom = d.getDate()
    const mon = d.getMonth() + 1
    const dow = d.getDay()

    const matchMin = !minutes || minutes.includes(m)
    const matchHr = !hours || hours.includes(h)
    const matchDom = !doms || doms.includes(dom)
    const matchMon = !months || months.includes(mon)
    const matchDow = !dows || dows.includes(dow)

    if (matchMin && matchHr && matchDom && matchMon && matchDow) {
      results.push(new Date(d))
    }

    d.setMinutes(d.getMinutes() + 1)
  }

  return results
}

const PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Every day at midnight', value: '0 0 * * *' },
  { label: 'Every Monday 9 AM', value: '0 9 * * 1' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'First of month', value: '0 0 1 * *' },
  { label: 'Weekdays 9 AM', value: '0 9 * * 1-5' },
  { label: 'Every 6 hours', value: '0 */6 * * *' },
]

export default function CronReaderTool() {
  const [cron, setCron] = useState('*/15 * * * *')

  const parts = cron.trim().split(/\s+/)
  const isValid = parts.length >= 5 && parts.length <= 6

  const description = useMemo(() => {
    if (!isValid) return ''
    return parseCronExpression(cron)
  }, [cron, isValid])

  const nextRuns = useMemo(() => {
    if (!isValid) return []
    try {
      return getNextRuns(cron, 5)
    } catch {
      return []
    }
  }, [cron, isValid])

  return (
    <ToolLayout
      title="Cron Expression Reader"
      description="Parse and understand cron expressions with next run predictions"
      icon={Clock}
    >
      {/* Input */}
      <div>
        <p className="text-muted-foreground mb-1.5 text-xs font-medium">Cron Expression</p>
        <Input
          value={cron}
          onChange={(e) => setCron(e.target.value)}
          placeholder="*/15 * * * *"
          className="bg-secondary border-border text-foreground font-mono text-lg"
        />
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => setCron(p.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              cron.trim() === p.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Field breakdown */}
      {isValid && (
        <div className="border-border bg-card overflow-hidden rounded-lg border">
          <div className="border-border bg-secondary/30 border-b px-5 py-3">
            <p className="text-foreground text-xs font-semibold">Field Breakdown</p>
          </div>
          <div className="divide-border/50 grid grid-cols-5 divide-x">
            {FIELDS.map((field, i) => (
              <div key={field.name} className="px-3 py-3 text-center">
                <p className="text-primary font-mono text-lg font-bold">{parts[i] ?? '*'}</p>
                <p className="text-foreground mt-1 text-[11px] font-semibold">{field.name}</p>
                <p className="text-muted-foreground text-[10px]">{field.allowed}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      {description && (
        <div className="border-primary/30 bg-primary/5 flex items-start gap-3 rounded-lg border px-5 py-4">
          <Info className="text-primary mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="text-foreground text-xs font-semibold">Human Readable</p>
            <p className="text-primary mt-1 text-sm capitalize">{description}</p>
          </div>
        </div>
      )}

      {/* Next Runs */}
      {nextRuns.length > 0 && (
        <div className="border-border bg-card overflow-hidden rounded-lg border">
          <div className="border-border bg-secondary/30 border-b px-5 py-3">
            <p className="text-foreground text-xs font-semibold">Next 5 Runs (from now)</p>
          </div>
          <div className="divide-border/50 divide-y">
            {nextRuns.map((d, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <span className="bg-primary/15 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold">
                  {i + 1}
                </span>
                <span className="text-foreground font-mono text-sm">
                  {d.toLocaleString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}
                </span>
                <span className="text-muted-foreground text-xs">{d.toISOString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isValid && cron.trim() && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm">
          Invalid cron expression. Expected 5 or 6 space-separated fields.
        </div>
      )}
    </ToolLayout>
  )
}
