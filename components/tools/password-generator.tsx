'use client'

import { useState, useCallback } from 'react'
import { KeyRound, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { ToolLayout, OutputBox } from '@/components/tool-layout'

const LOWER = 'abcdefghijklmnopqrstuvwxyz'
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const NUMBERS = '0123456789'
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'
const EXTRA = '~`\'"/\\?'

export default function PasswordGeneratorTool() {
  const [length, setLength] = useState(16)
  const [useLower, setUseLower] = useState(true)
  const [useUpper, setUseUpper] = useState(true)
  const [useNumbers, setUseNumbers] = useState(true)
  const [useSymbols, setUseSymbols] = useState(true)
  const [useExtra, setUseExtra] = useState(false)
  const [exclude, setExclude] = useState('')
  const [password, setPassword] = useState('')

  const generate = useCallback(() => {
    let chars = ''
    if (useLower) chars += LOWER
    if (useUpper) chars += UPPER
    if (useNumbers) chars += NUMBERS
    if (useSymbols) chars += SYMBOLS
    if (useExtra) chars += EXTRA
    if (!chars) {
      setPassword('')
      return
    }
    if (exclude) {
      const excludeSet = new Set(exclude.split(''))
      chars = chars
        .split('')
        .filter((c) => !excludeSet.has(c))
        .join('')
    }
    if (!chars) {
      setPassword('')
      return
    }
    const values = crypto.getRandomValues(new Uint32Array(length))
    const pw = Array.from(values)
      .map((v) => chars[v % chars.length])
      .join('')
    setPassword(pw)
  }, [length, useLower, useUpper, useNumbers, useSymbols, useExtra, exclude])

  const getStrength = (): { label: string; color: string; percent: number } => {
    if (!password) return { label: 'None', color: 'bg-muted', percent: 0 }
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 16) score++
    if (password.length >= 24) score++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
    if (/\d/.test(password)) score++
    if (/[^a-zA-Z\d]/.test(password)) score++
    if (score <= 2) return { label: 'Weak', color: 'bg-destructive', percent: 25 }
    if (score <= 3) return { label: 'Fair', color: 'bg-chart-4', percent: 50 }
    if (score <= 4) return { label: 'Good', color: 'bg-chart-2', percent: 75 }
    return { label: 'Strong', color: 'bg-primary', percent: 100 }
  }

  const strength = getStrength()

  return (
    <ToolLayout
      title="Password Generator"
      description="Create strong, customizable passwords with advanced options"
      icon={KeyRound}
    >
      <div className="border-border bg-card rounded-lg border p-5">
        <div className="mb-5">
          <OutputBox value={password} label="Generated Password" />
          {/* Strength bar */}
          {password && (
            <div className="mt-3 flex items-center gap-3">
              <div className="bg-secondary h-2 flex-1 rounded-full">
                <div
                  className={`h-2 rounded-full transition-all ${strength.color}`}
                  style={{ width: `${strength.percent}%` }}
                />
              </div>
              <span className="text-muted-foreground text-xs font-medium">{strength.label}</span>
            </div>
          )}
        </div>

        {/* Length slider */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <Label className="text-muted-foreground text-xs">Length</Label>
            <span className="text-foreground font-mono text-sm font-bold">{length}</span>
          </div>
          <Slider
            value={[length]}
            onValueChange={([v]) => setLength(v)}
            min={4}
            max={128}
            step={1}
          />
        </div>

        {/* Character toggles */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: 'Lowercase (a-z)', checked: useLower, set: setUseLower },
            { label: 'Uppercase (A-Z)', checked: useUpper, set: setUseUpper },
            { label: 'Numbers (0-9)', checked: useNumbers, set: setUseNumbers },
            { label: 'Symbols (!@#$...)', checked: useSymbols, set: setUseSymbols },
            { label: 'Extra (~`\'"/\\)', checked: useExtra, set: setUseExtra },
          ].map((opt) => (
            <div
              key={opt.label}
              className="border-border bg-secondary/50 flex items-center justify-between rounded-lg border px-4 py-3"
            >
              <Label className="text-foreground text-sm">{opt.label}</Label>
              <Switch checked={opt.checked} onCheckedChange={opt.set} />
            </div>
          ))}
        </div>

        {/* Exclude chars */}
        <div className="mt-4">
          <Label className="text-muted-foreground text-xs">Exclude Characters</Label>
          <input
            value={exclude}
            onChange={(e) => setExclude(e.target.value)}
            placeholder="e.g. lIO0"
            className="border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:ring-ring mt-1 w-full rounded-lg border px-4 py-2 font-mono text-sm focus:ring-1 focus:outline-none"
          />
        </div>

        <Button
          onClick={generate}
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-5 w-full gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Generate Password
        </Button>
      </div>
    </ToolLayout>
  )
}
