'use client'

import { useState, useMemo } from 'react'
import { useCopyToClipboard } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, Check, Settings2 } from 'lucide-react'

type Unit = 'px' | 'rem' | 'em' | 'pt' | 'vw' | 'vh' | '%'

const UNITS: Unit[] = ['px', 'rem', 'em', 'pt', 'vw', 'vh', '%']

export default function CssUnitConverter() {
  const [inputValue, setInputValue] = useState<number | string>(16)
  const [inputUnit, setInputUnit] = useState<Unit>('px')

  const [rootFontSize, setRootFontSize] = useState<number | string>(16)
  const [contextFontSize, setContextFontSize] = useState<number | string>(16)
  const [viewportWidth, setViewportWidth] = useState<number | string>(1920)
  const [viewportHeight, setViewportHeight] = useState<number | string>(1080)
  const [parentSize, setParentSize] = useState<number | string>(1000)

  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const copyToClipboard = useCopyToClipboard()

  const val = Number(inputValue) || 0
  const rfs = Number(rootFontSize) || 16
  const cfs = Number(contextFontSize) || 16
  const vw = Number(viewportWidth) || 1920
  const vh = Number(viewportHeight) || 1080
  const pSize = Number(parentSize) || 1000

  const convertToPx = (value: number, from: Unit): number => {
    switch (from) {
      case 'px':
        return value
      case 'rem':
        return value * rfs
      case 'em':
        return value * cfs
      case 'pt':
        return value * (96 / 72)
      case 'vw':
        return (value / 100) * vw
      case 'vh':
        return (value / 100) * vh
      case '%':
        return (value / 100) * pSize
      default:
        return value
    }
  }

  const convertFromPx = (pxValue: number, to: Unit): number => {
    switch (to) {
      case 'px':
        return pxValue
      case 'rem':
        return pxValue / rfs
      case 'em':
        return pxValue / cfs
      case 'pt':
        return pxValue / (96 / 72)
      case 'vw':
        return (pxValue / vw) * 100
      case 'vh':
        return (pxValue / vh) * 100
      case '%':
        return (pxValue / pSize) * 100
      default:
        return pxValue
    }
  }

  const basePx = convertToPx(val, inputUnit)

  const handleCopy = (text: string, index: number) => {
    copyToClipboard(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const formatResult = (num: number) => {
    if (isNaN(num) || !isFinite(num)) return '0'
    return Number(num.toFixed(4)).toString()
  }

  const allConversions = useMemo(() => {
    return UNITS.map((unit) => ({
      unit,
      value: formatResult(convertFromPx(basePx, unit)),
    }))
  }, [basePx, rfs, cfs, vw, vh, pSize])

  return (
    <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
      <div className="space-y-6">
        <div className="border-border bg-card space-y-4 rounded-xl border p-5">
          <div className="text-foreground border-border flex items-center gap-2 border-b pb-2 text-sm font-semibold">
            <Settings2 className="text-muted-foreground h-4 w-4" />
            Context Settings
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Root Font Size (for rem)</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={rootFontSize}
                  onChange={(e) => setRootFontSize(e.target.value)}
                  className="bg-secondary pr-8"
                />
                <span className="text-muted-foreground absolute top-2.5 right-3 text-xs">px</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Context Font Size (for em)</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={contextFontSize}
                  onChange={(e) => setContextFontSize(e.target.value)}
                  className="bg-secondary pr-8"
                />
                <span className="text-muted-foreground absolute top-2.5 right-3 text-xs">px</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Viewport Size (for vw, vh)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <Input
                    type="number"
                    value={viewportWidth}
                    onChange={(e) => setViewportWidth(e.target.value)}
                    className="bg-secondary pr-6"
                    placeholder="W"
                  />
                  <span className="text-muted-foreground absolute top-2.5 right-2 text-xs">W</span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    value={viewportHeight}
                    onChange={(e) => setViewportHeight(e.target.value)}
                    className="bg-secondary pr-6"
                    placeholder="H"
                  />
                  <span className="text-muted-foreground absolute top-2.5 right-2 text-xs">H</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Parent Size (for %)</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={parentSize}
                  onChange={(e) => setParentSize(e.target.value)}
                  className="bg-secondary pr-8"
                />
                <span className="text-muted-foreground absolute top-2.5 right-3 text-xs">px</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="border-border bg-card rounded-xl border p-6 shadow-sm">
          <div className="space-y-4">
            <Label className="text-foreground block text-sm font-semibold">Input Value</Label>
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="focus-visible:border-primary h-14 border-2 px-4 font-mono text-2xl transition-colors focus-visible:ring-0"
                />
              </div>
              <div className="sm:w-32">
                <select
                  className="border-input bg-background focus:border-primary h-14 w-full cursor-pointer rounded-md border-2 px-4 text-sm font-semibold shadow-sm focus:ring-0 focus:outline-none"
                  value={inputUnit}
                  onChange={(e) => setInputUnit(e.target.value as Unit)}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allConversions.map((conv, i) => {
            const isSelf = conv.unit === inputUnit
            return (
              <div
                key={conv.unit}
                className={`flex items-center justify-between rounded-xl border p-4 transition-all ${isSelf ? 'bg-primary/5 border-primary/20' : 'bg-card border-border hover:border-border/80'}`}
              >
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-[10px] tracking-widest uppercase">
                    {conv.unit}
                  </Label>
                  <div className="text-foreground font-mono text-lg">{conv.value}</div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full"
                  onClick={() => handleCopy(`${conv.value}${conv.unit}`, i)}
                  title={`Copy ${conv.value}${conv.unit}`}
                >
                  {copiedIndex === i ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="text-muted-foreground h-4 w-4" />
                  )}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
