'use client'

import { useState, useRef } from 'react'
import { useCopyToClipboard } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Copy, Plus, X, Shuffle, Image as ImageIcon, Check } from 'lucide-react'

interface ColorStop {
  id: string
  color: string
  position: number
  opacity: number
}

function randomColor() {
  return (
    '#' +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, '0')
  )
}

export default function CssGradientGenerator() {
  const [mode, setMode] = useState<'linear' | 'radial' | 'conic'>('linear')
  const [stops, setStops] = useState<ColorStop[]>([
    { id: '1', color: '#4f46e5', position: 0, opacity: 1 },
    { id: '2', color: '#ec4899', position: 100, opacity: 1 },
  ])

  const [linearAngle, setLinearAngle] = useState(90)
  const [radialShape, setRadialShape] = useState('circle')
  const [radialPosition, setRadialPosition] = useState('center')
  const [conicAngle, setConicAngle] = useState(0)
  const [conicPosition, setConicPosition] = useState('center')

  const [copied, setCopied] = useState(false)
  const copyToClipboard = useCopyToClipboard()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const addStop = () => {
    if (stops.length >= 8) return
    const newPos = Math.round((stops[stops.length - 1].position + stops[0].position) / 2) || 50
    setStops(
      [
        ...stops,
        { id: crypto.randomUUID(), color: randomColor(), position: newPos, opacity: 1 },
      ].sort((a, b) => a.position - b.position),
    )
  }

  const removeStop = (id: string) => {
    if (stops.length <= 2) return
    setStops(stops.filter((s) => s.id !== id))
  }

  const updateStop = (id: string, field: keyof ColorStop, value: number | string) => {
    setStops(
      stops
        .map((s) => (s.id === id ? { ...s, [field]: value } : s))
        .sort((a, b) => a.position - b.position),
    )
  }

  const randomize = () => {
    const types: ('linear' | 'radial' | 'conic')[] = ['linear', 'radial', 'conic']
    setMode(types[Math.floor(Math.random() * types.length)])
    setLinearAngle(Math.floor(Math.random() * 360))
    setConicAngle(Math.floor(Math.random() * 360))

    const colors = Array.from({ length: Math.floor(Math.random() * 2) + 2 }, (_, i) => ({
      id: crypto.randomUUID(),
      color: randomColor(),
      position:
        i === 0 ? 0 : i === 1 && Math.random() > 0.5 ? 100 : Math.floor(Math.random() * 100),
      opacity: 1,
    })).sort((a, b) => a.position - b.position)

    colors[0].position = 0
    colors[colors.length - 1].position = 100
    setStops(colors)
  }

  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16) || 0
    const g = parseInt(hex.slice(3, 5), 16) || 0
    const b = parseInt(hex.slice(5, 7), 16) || 0
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const getGradientString = () => {
    const colorStopsStr = stops
      .map((s) => `${hexToRgba(s.color, s.opacity)} ${s.position}%`)
      .join(', ')

    if (mode === 'linear') {
      return `linear-gradient(${linearAngle}deg, ${colorStopsStr})`
    }
    if (mode === 'radial') {
      return `radial-gradient(${radialShape} at ${radialPosition}, ${colorStopsStr})`
    }
    if (mode === 'conic') {
      return `conic-gradient(from ${conicAngle}deg at ${conicPosition}, ${colorStopsStr})`
    }
    return ''
  }

  const cssValue = getGradientString()
  const webkitCssValue = cssValue.replace(
    /linear-gradient|radial-gradient|conic-gradient/g,
    '-webkit-$&',
  )

  const copyOut = () => {
    void copyToClipboard(`background: ${cssValue};\nbackground: ${webkitCssValue};`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const exportPng = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 1920
    canvas.height = 1080

    let grd
    const cx = canvas.width / 2
    const cy = canvas.height / 2

    if (mode === 'linear') {
      const angleRad = ((linearAngle - 90) * Math.PI) / 180
      const length = Math.sqrt(cx * cx + cy * cy)
      const x1 = cx - Math.cos(angleRad) * length
      const y1 = cy - Math.sin(angleRad) * length
      const x2 = cx + Math.cos(angleRad) * length
      const y2 = cy + Math.sin(angleRad) * length
      grd = ctx.createLinearGradient(x1, y1, x2, y2)
    } else if (mode === 'radial') {
      grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(canvas.width, canvas.height) / 2)
    } else {
      // Conic requires DOMMatrix in canvas, fallback to drawing simple rect here as a limitation
      // Best to just use a huge SVG and convert to canvas, or rely on CSS for actual app usage.
      grd = ctx.createLinearGradient(0, 0, canvas.width, canvas.height) // Mock fallback for export
    }

    stops.forEach((s) => {
      grd.addColorStop(s.position / 100, hexToRgba(s.color, s.opacity))
    })

    ctx.fillStyle = grd
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const link = document.createElement('a')
    link.download = `gradient-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="space-y-6">
      <div
        className="border-border h-48 w-full rounded-xl border shadow-inner transition-all duration-300 sm:h-64"
        style={{ background: cssValue }}
      />
      <canvas ref={canvasRef} className="hidden" />

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        <div className="space-y-6">
          <div className="border-border bg-card space-y-5 rounded-xl border p-5">
            <div className="flex items-center justify-between">
              <Label className="text-foreground text-sm font-semibold">Gradient Style</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={randomize}
                className="text-muted-foreground hover:text-foreground h-8 gap-1.5 text-xs leading-none"
              >
                <Shuffle className="h-3 w-3" /> Randomize
              </Button>
            </div>

            <Tabs value={mode} onValueChange={(v) => setMode(v as 'linear' | 'radial' | 'conic')}>
              <TabsList className="bg-secondary grid w-full grid-cols-3">
                <TabsTrigger value="linear" className="text-xs">
                  Linear
                </TabsTrigger>
                <TabsTrigger value="radial" className="text-xs">
                  Radial
                </TabsTrigger>
                <TabsTrigger value="conic" className="text-xs">
                  Conic
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {mode === 'linear' && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Label className="text-muted-foreground text-xs font-medium">Angle (deg)</Label>
                  <span className="text-primary font-mono text-xs">{linearAngle}°</span>
                </div>
                <Slider
                  value={[linearAngle]}
                  onValueChange={([v]) => setLinearAngle(v)}
                  min={0}
                  max={360}
                  step={1}
                />
              </div>
            )}

            {mode === 'radial' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs font-medium">Shape</Label>
                  <Select value={radialShape} onValueChange={setRadialShape}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select shape" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="circle">Circle</SelectItem>
                      <SelectItem value="ellipse">Ellipse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs font-medium">Position</Label>
                  <Select value={radialPosition} onValueChange={setRadialPosition}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="top left">Top Left</SelectItem>
                      <SelectItem value="top right">Top Right</SelectItem>
                      <SelectItem value="bottom left">Bottom Left</SelectItem>
                      <SelectItem value="bottom right">Bottom Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {mode === 'conic' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Label className="text-muted-foreground text-xs font-medium">Angle</Label>
                    <span className="text-primary font-mono text-xs">{conicAngle}°</span>
                  </div>
                  <Slider
                    value={[conicAngle]}
                    onValueChange={([v]) => setConicAngle(v)}
                    min={0}
                    max={360}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs font-medium">Position</Label>
                  <Select value={conicPosition} onValueChange={setConicPosition}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="top left">Top Left</SelectItem>
                      <SelectItem value="top right">Top Right</SelectItem>
                      <SelectItem value="bottom left">Bottom Left</SelectItem>
                      <SelectItem value="bottom right">Bottom Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <div className="border-border bg-card space-y-4 rounded-xl border p-5">
            <div className="flex items-center justify-between">
              <Label className="text-foreground text-sm font-semibold">Color Stops</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={addStop}
                disabled={stops.length >= 8}
                className="text-muted-foreground hover:text-foreground h-7 gap-1 text-xs"
              >
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>

            <div className="space-y-3">
              {stops.map((stop) => (
                <div
                  key={stop.id}
                  className="border-border bg-secondary/30 group relative flex items-center gap-3 rounded-lg border p-3"
                >
                  <div className="flex flex-col gap-2">
                    <Input
                      type="color"
                      value={stop.color}
                      title="Color"
                      onChange={(e) => updateStop(stop.id, 'color', e.target.value)}
                      className="bg-secondary h-8 w-12 cursor-pointer p-1"
                    />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={stop.color}
                        onChange={(e) => updateStop(stop.id, 'color', e.target.value)}
                        className="bg-secondary h-7 w-20 font-mono text-xs"
                      />
                      <span className="text-muted-foreground w-12 text-right text-xs">
                        {stop.position}%
                      </span>
                    </div>
                    <Slider
                      value={[stop.position]}
                      onValueChange={([v]) => updateStop(stop.id, 'position', v)}
                      min={0}
                      max={100}
                      step={1}
                    />
                  </div>
                  <div className="w-16 space-y-1">
                    <Label className="text-muted-foreground block text-center text-[9px] uppercase">
                      Opacity
                    </Label>
                    <Input
                      type="number"
                      value={stop.opacity}
                      onChange={(e) =>
                        updateStop(
                          stop.id,
                          'opacity',
                          Math.max(0, Math.min(1, Number(e.target.value))),
                        )
                      }
                      step={0.1}
                      min={0}
                      max={1}
                      className="bg-secondary h-7 px-1 text-center font-mono text-[10px]"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStop(stop.id)}
                    disabled={stops.length <= 2}
                    className="bg-destructive text-destructive-foreground absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border-border bg-card space-y-4 rounded-xl border p-5">
            <div className="border-border flex items-center justify-between border-b pb-2">
              <Label className="text-foreground text-sm font-semibold">CSS Output</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyOut}
                className="text-muted-foreground hover:text-foreground h-7 gap-1 text-xs"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                Copy
              </Button>
            </div>
            <pre className="bg-secondary text-primary word-break-all overflow-x-auto rounded-lg p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
              background: {cssValue};{'\n'}
              background: {webkitCssValue};
            </pre>
          </div>

          <Button
            variant="outline"
            className="text-muted-foreground hover:text-foreground w-full gap-2"
            onClick={exportPng}
          >
            <ImageIcon className="h-4 w-4" /> Export as PNG (1920x1080)
          </Button>
        </div>
      </div>
    </div>
  )
}
