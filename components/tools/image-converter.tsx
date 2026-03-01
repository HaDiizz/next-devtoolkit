'use client'

import { useState, useRef, useCallback } from 'react'
import { ImageIcon, Upload, X, Download, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ToolLayout } from '@/components/tool-layout'

type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/bmp'

const FORMAT_OPTIONS: { value: OutputFormat; label: string; ext: string }[] = [
  { value: 'image/png', label: 'PNG', ext: 'png' },
  { value: 'image/jpeg', label: 'JPEG', ext: 'jpg' },
  { value: 'image/webp', label: 'WebP', ext: 'webp' },
  { value: 'image/bmp', label: 'BMP', ext: 'bmp' },
]

export default function ImageConverterTool() {
  const [sourcePreview, setSourcePreview] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [sourceType, setSourceType] = useState('')
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('image/png')
  const [quality, setQuality] = useState(92)
  const [convertedUrl, setConvertedUrl] = useState('')
  const [convertedSize, setConvertedSize] = useState(0)
  const [sourceSize, setSourceSize] = useState(0)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    setError('')
    setConvertedUrl('')
    setSourceName(file.name)
    setSourceType(file.type || 'unknown')
    setSourceSize(file.size)

    const reader = new FileReader()
    reader.onload = () => {
      setSourcePreview(reader.result as string)
    }
    reader.onerror = () => setError('Failed to read file.')
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file && file.type.startsWith('image')) {
        handleFile(file)
      }
    },
    [handleFile],
  )

  const convert = () => {
    if (!sourcePreview) return
    setError('')

    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        setError('Canvas context not available.')
        return
      }

      // For JPEG, fill white background (no alpha support)
      if (outputFormat === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      ctx.drawImage(img, 0, 0)

      const q = outputFormat === 'image/png' ? undefined : quality / 100
      const dataUrl = canvas.toDataURL(outputFormat, q)
      setConvertedUrl(dataUrl)

      // Estimate size from base64
      const base64 = dataUrl.split(',')[1]
      if (base64) {
        setConvertedSize(Math.round((base64.length * 3) / 4))
      }
    }
    img.onerror = () => setError('Failed to load image for conversion.')
    img.src = sourcePreview
  }

  const download = () => {
    if (!convertedUrl) return
    const ext = FORMAT_OPTIONS.find((f) => f.value === outputFormat)?.ext ?? 'png'
    const baseName = sourceName.replace(/\.[^.]+$/, '')
    const a = document.createElement('a')
    a.href = convertedUrl
    a.download = `${baseName}.${ext}`
    a.click()
  }

  const clear = () => {
    setSourcePreview('')
    setSourceName('')
    setSourceType('')
    setSourceSize(0)
    setConvertedUrl('')
    setConvertedSize(0)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <ToolLayout
      title="Image Format Converter"
      description="Convert images between PNG, JPEG, WebP, and BMP formats"
      icon={ImageIcon}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.svg"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
        className="hidden"
      />

      {/* Upload area */}
      {!sourcePreview ? (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-border bg-secondary/30 text-muted-foreground hover:border-primary/40 hover:bg-secondary/50 flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-16 transition-colors"
        >
          <Upload className="h-8 w-8" />
          <div className="text-center">
            <p className="text-foreground text-sm font-medium">
              Drop an image here or click to upload
            </p>
            <p className="mt-1 text-xs">Supports PNG, JPG, GIF, WebP, SVG, BMP, ICO</p>
          </div>
        </button>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Source info & preview */}
          <div className="border-border bg-secondary/30 rounded-lg border p-4">
            <div className="mb-3 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <ImageIcon className="text-primary h-5 w-5" />
                <div>
                  <p className="text-foreground text-sm font-medium">{sourceName}</p>
                  <p className="text-muted-foreground text-xs">
                    {sourceType} &middot; {formatBytes(sourceSize)}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground h-8 w-8"
                onClick={clear}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="bg-background/50 flex items-center justify-center rounded-lg p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sourcePreview}
                alt="Source preview"
                className="max-h-52 max-w-full rounded object-contain"
              />
            </div>
          </div>

          {/* Output format selector */}
          <div className="flex flex-col gap-3">
            <Label className="text-muted-foreground text-xs">Convert to</Label>
            <div className="flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map((fmt) => (
                <button
                  key={fmt.value}
                  onClick={() => {
                    setOutputFormat(fmt.value)
                    setConvertedUrl('')
                  }}
                  className={`rounded-lg border px-4 py-2 text-xs font-medium transition-colors ${
                    outputFormat === fmt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quality slider (for JPEG/WebP) */}
          {(outputFormat === 'image/jpeg' || outputFormat === 'image/webp') && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-xs">Quality</Label>
                <span className="text-foreground font-mono text-xs">{quality}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={quality}
                onChange={(e) => {
                  setQuality(Number(e.target.value))
                  setConvertedUrl('')
                }}
                className="bg-secondary accent-primary h-2 w-full cursor-pointer appearance-none rounded-lg"
              />
              <div className="text-muted-foreground flex justify-between text-[10px]">
                <span>Small file</span>
                <span>Best quality</span>
              </div>
            </div>
          )}

          {/* Convert button */}
          <Button
            onClick={convert}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-fit gap-2"
          >
            Convert
            <ArrowRight className="h-4 w-4" />
          </Button>

          {/* Converted result */}
          {convertedUrl && (
            <div className="border-primary/30 bg-primary/5 rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-foreground text-sm font-medium">Converted Result</p>
                  <p className="text-muted-foreground text-xs">
                    {FORMAT_OPTIONS.find((f) => f.value === outputFormat)?.label} &middot;{' '}
                    {formatBytes(convertedSize)}
                    {sourceSize > 0 && (
                      <span
                        className={convertedSize < sourceSize ? 'text-primary' : 'text-destructive'}
                      >
                        {' '}
                        ({convertedSize < sourceSize ? '-' : '+'}
                        {Math.abs(Math.round(((convertedSize - sourceSize) / sourceSize) * 100))}%)
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  onClick={download}
                  size="sm"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
              <div className="bg-background/50 flex items-center justify-center rounded-lg p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={convertedUrl}
                  alt="Converted preview"
                  className="max-h-52 max-w-full rounded object-contain"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm">
          {error}
        </div>
      )}
    </ToolLayout>
  )
}
