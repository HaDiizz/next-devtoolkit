'use client'

import { useState } from 'react'
import { Palette } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ToolLayout, OutputBox } from '@/components/tool-layout'

function hexToRgb(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '')
  if (clean.length !== 6 && clean.length !== 3) return null
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  const num = parseInt(full, 16)
  if (isNaN(num)) return null
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b)
  let h = 0,
    s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)]
}

export default function ColorConverterTool() {
  const [hex, setHex] = useState('#10b981')
  const rgb = hexToRgb(hex)
  const hsl = rgb ? rgbToHsl(...rgb) : null

  return (
    <ToolLayout
      title="Color Converter"
      description="Convert between HEX, RGB, and HSL color formats"
      icon={Palette}
    >
      <div className="border-border bg-card rounded-lg border p-5">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label className="text-muted-foreground text-xs">Pick Color</Label>
            <div className="mt-1 flex items-center gap-3">
              <input
                type="color"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border-0 bg-transparent"
              />
              <Input
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                placeholder="#10b981"
                className="bg-secondary border-border text-foreground w-32 font-mono"
              />
            </div>
          </div>
          {/* Preview */}
          <div
            className="border-border h-20 w-20 rounded-xl border"
            style={{ backgroundColor: hex }}
          />
        </div>

        {rgb && hsl && (
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <OutputBox label="HEX" value={hex.toUpperCase()} />
            <OutputBox label="RGB" value={`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`} />
            <OutputBox label="HSL" value={`hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`} />
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
