'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  FileIcon,
  Upload,
  X,
  Download,
  Zap,
  CheckCircle2,
  RefreshCw,
  Lock,
  Unlock,
  ImageIcon,
  FileText,
  FileArchive,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ToolLayout } from '@/components/tool-layout'
import JSZip from 'jszip'

type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'application/zip'

export default function FileCompressor() {
  const [sourceFile, setSourceFile] = useState<File | null>(null)
  const [sourcePreview, setSourcePreview] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [sourceType, setSourceType] = useState('')
  const [sourceSize, setSourceSize] = useState(0)

  const [originalWidth, setOriginalWidth] = useState(0)
  const [originalHeight, setOriginalHeight] = useState(0)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [lockAspectRatio, setLockAspectRatio] = useState(true)
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('image/webp')

  const [compressionMode, setCompressionMode] = useState<'preset' | 'target' | 'custom'>('preset')
  const [preset, setPreset] = useState<'small' | 'balanced' | 'high'>('balanced')
  const [customQuality, setCustomQuality] = useState(80)
  const [targetSizeKB, setTargetSizeKB] = useState(100)

  const [convertedUrl, setConvertedUrl] = useState('')
  const [convertedSize, setConvertedSize] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isImage = sourceType.startsWith('image/')
  const isPdf = sourceType === 'application/pdf'

  useEffect(() => {
    if (sourceType && !isImage) {
      setOutputFormat('application/zip')
    } else if (isImage && outputFormat === 'application/zip') {
      setOutputFormat('image/webp')
    }
  }, [sourceType, isImage, outputFormat])

  const handleFile = useCallback((file: File) => {
    setConvertedUrl('')
    setConvertedSize(0)
    setSourceFile(file)
    setSourceName(file.name)
    setSourceType(file.type || 'unknown')
    setSourceSize(file.size)
    setSourcePreview('')

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      if (file.type.startsWith('image/')) {
        setSourcePreview(dataUrl)
        const img = new window.Image()
        img.onload = () => {
          setOriginalWidth(img.naturalWidth)
          setOriginalHeight(img.naturalHeight)
          setWidth(img.naturalWidth)
          setHeight(img.naturalHeight)
        }
        img.src = dataUrl
      }
    }
    reader.onerror = () => setError('Failed to read file.')
    reader.readAsDataURL(file)
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile],
  )

  const compressImage = async (img: HTMLImageElement) => {
    const canvas = document.createElement('canvas')
    const targetWidth = width || img.naturalWidth
    const targetHeight = height || img.naturalHeight
    canvas.width = targetWidth
    canvas.height = targetHeight
    const ctx = canvas.getContext('2d')

    if (!ctx) throw new Error('Canvas context not available')

    if (outputFormat === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

    const getQuality = () => {
      if (compressionMode === 'preset') {
        if (preset === 'small') return 0.25
        if (preset === 'balanced') return 0.65
        return 0.9
      }
      if (compressionMode === 'custom') return customQuality / 100
      return 0.8
    }

    const initialQ = outputFormat === 'image/png' ? undefined : getQuality()

    if (compressionMode === 'target' && outputFormat !== 'image/png' && targetSizeKB > 0) {
      let minQ = 0.01
      let maxQ = 0.99
      let bestBlob: Blob | null = null

      for (let i = 0; i < 8; i++) {
        const midQ = (minQ + maxQ) / 2
        const blob: Blob = await new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b!), outputFormat, midQ),
        )

        if (blob.size / 1024 <= targetSizeKB) {
          bestBlob = blob
          minQ = midQ
        } else {
          maxQ = midQ
        }
      }

      if (!bestBlob) {
        bestBlob = await new Promise((resolve) =>
          canvas.toBlob((b) => resolve(b!), outputFormat, 0.01),
        )
      }
      return bestBlob
    }

    return new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), outputFormat, initialQ))
  }

  const compressGeneric = async (): Promise<Blob | null> => {
    if (!sourceFile) return null
    const zip = new JSZip()
    zip.file(sourceName, sourceFile)
    return await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 },
    })
  }

  const handleOptimize = async () => {
    if (!sourceFile) return
    setIsProcessing(true)
    setError('')

    try {
      let finalBlob: Blob | null = null
      if (isImage) {
        const img = new window.Image()
        img.src = sourcePreview
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })
        finalBlob = await compressImage(img)
      } else {
        finalBlob = await compressGeneric()
      }

      if (!finalBlob) throw new Error('Optimization failed')

      setConvertedSize(finalBlob.size)
      setConvertedUrl(URL.createObjectURL(finalBlob))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Optimization failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const download = () => {
    if (!convertedUrl) return
    const link = document.createElement('a')
    const ext = outputFormat === 'application/zip' ? 'zip' : outputFormat.split('/')[1]
    link.href = convertedUrl
    link.download = `optimized-${sourceName.split('.')[0]}.${ext}`
    link.click()
  }

  const clear = () => {
    setSourceFile(null)
    setSourcePreview('')
    setSourceName('')
    setSourceType('')
    setSourceSize(0)
    setConvertedUrl('')
    setConvertedSize(0)
    setError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const reduction =
    sourceSize > 0 && convertedSize > 0
      ? Math.round(((sourceSize - convertedSize) / sourceSize) * 100)
      : 0

  const getFileIcon = () => {
    if (isImage) return <ImageIcon className="text-primary h-10 w-10" />
    if (isPdf) return <FileText className="h-10 w-10 text-red-500" />
    if (sourceType.includes('zip') || sourceType.includes('rar'))
      return <FileArchive className="h-10 w-10 text-yellow-500" />
    return <FileIcon className="h-10 w-10 text-blue-500" />
  }

  return (
    <ToolLayout
      title="File Compressor"
      description="Optimize images, PDFs, and generic files to reduce storage space"
      icon={Zap}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          {!sourceName ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
              className="border-primary/20 bg-secondary/30 hover:border-primary/40 flex h-[400px] flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all"
            >
              <div className="bg-primary/10 mb-4 rounded-full p-6">
                <Upload className="text-primary h-10 w-10" />
              </div>
              <h3 className="text-foreground text-lg font-semibold">Drop file here</h3>
              <p className="text-muted-foreground mt-1 text-center text-sm">
                Images (PNG/JPG/WebP), PDF, and other files
              </p>
              <Button
                variant="outline"
                className="text-muted-foreground dark:hover:text-foreground mt-6 hover:text-white"
                onClick={() => fileInputRef.current?.click()}
              >
                Select File
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                }}
                className="hidden"
              />
            </div>
          ) : (
            <div className="bg-secondary/30 relative flex h-[400px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-white/5">
              {isImage && sourcePreview ? (
                <img
                  src={convertedUrl || sourcePreview}
                  className="h-full w-full object-contain"
                  alt="Preview"
                />
              ) : (
                <div className="flex flex-col items-center gap-4">
                  {getFileIcon()}
                  <p className="text-foreground font-medium">{sourceName}</p>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/50 text-white backdrop-blur-md hover:bg-black/70"
                onClick={clear}
              >
                <X className="h-4 w-4" />
              </Button>

              <div className="absolute right-4 bottom-4 left-4 flex items-center justify-between rounded-full bg-black/50 px-4 py-2 text-xs text-white backdrop-blur-md">
                <span className="max-w-[150px] truncate">{sourceName}</span>
                <div className="flex items-center gap-4 font-mono">
                  <span>{formatSize(convertedSize || sourceSize)}</span>
                  {reduction !== 0 && (
                    <span className={reduction > 0 ? 'text-green-400' : 'text-red-400'}>
                      {reduction > 0 ? `-${reduction}%` : `+${Math.abs(reduction)}%`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-xs">{error}</div>
          )}
        </div>

        <div className="space-y-6 lg:col-span-5">
          <div className="bg-secondary/30 space-y-6 rounded-2xl border border-white/5 p-6">
            {isImage ? (
              <>
                <div className="space-y-3">
                  <Label className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
                    Format & Resize
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {['image/webp', 'image/jpeg', 'image/png'].map((fmt) => (
                      <button
                        key={fmt}
                        onClick={() => {
                          setOutputFormat(fmt as OutputFormat)
                          setConvertedUrl('')
                        }}
                        className={`rounded-lg border py-2 text-xs font-medium transition-all ${
                          outputFormat === fmt
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-secondary/50 text-muted-foreground hover:border-primary/40'
                        }`}
                      >
                        {fmt.split('/')[1].toUpperCase()}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <div className="flex-1 space-y-1">
                      <Label className="text-muted-foreground text-[10px]">Width</Label>
                      <input
                        type="number"
                        value={width || ''}
                        onChange={(e) => {
                          const w = parseInt(e.target.value) || 0
                          setWidth(w)
                          if (lockAspectRatio && originalWidth > 0)
                            setHeight(Math.round((w * originalHeight) / originalWidth))
                          setConvertedUrl('')
                        }}
                        className="bg-secondary border-border text-foreground w-full rounded-md border px-3 py-1.5 font-mono text-xs outline-none"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`text-muted-foreground dark:hover:text-foreground mt-4 mt-5 h-8 w-8 rounded-full p-0 hover:text-white ${lockAspectRatio ? 'text-primary' : ''}`}
                      onClick={() => setLockAspectRatio(!lockAspectRatio)}
                    >
                      {lockAspectRatio ? (
                        <Lock className="h-3.5 w-3.5" />
                      ) : (
                        <Unlock className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <div className="flex-1 space-y-1">
                      <Label className="text-muted-foreground text-[10px]">Height</Label>
                      <input
                        type="number"
                        value={height || ''}
                        onChange={(e) => {
                          const h = parseInt(e.target.value) || 0
                          setHeight(h)
                          if (lockAspectRatio && originalHeight > 0)
                            setWidth(Math.round((h * originalWidth) / originalHeight))
                          setConvertedUrl('')
                        }}
                        className="bg-secondary border-border text-foreground w-full rounded-md border px-3 py-1.5 font-mono text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
                    Optimization Mode
                  </Label>
                  <div className="bg-secondary/50 flex rounded-lg p-1">
                    {(['preset', 'custom', 'target'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => {
                          setCompressionMode(mode)
                          setConvertedUrl('')
                        }}
                        className={`flex-1 rounded-md py-1.5 text-[10px] font-bold capitalize transition-all ${
                          compressionMode === mode
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>

                  {compressionMode === 'preset' && (
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'small', label: 'Smallest', q: '~25%' },
                        { id: 'balanced', label: 'Balanced', q: '~65%' },
                        { id: 'high', label: 'High Qual', q: '~90%' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setPreset(p.id as 'small' | 'balanced' | 'high')
                            setConvertedUrl('')
                          }}
                          className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-all ${
                            preset === p.id
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'border-border bg-secondary/50 text-muted-foreground'
                          }`}
                        >
                          <span className="text-[10px] font-bold">{p.label}</span>
                          <span className="text-[9px] opacity-60">{p.q}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {compressionMode === 'custom' && (
                    <div className="space-y-2">
                      <div className="flex justify-between font-mono text-xs">
                        <span>Quality</span>
                        <span>{customQuality}%</span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={100}
                        value={customQuality}
                        onChange={(e) => {
                          setCustomQuality(Number(e.target.value))
                          setConvertedUrl('')
                        }}
                        className="accent-primary w-full"
                      />
                    </div>
                  )}

                  {compressionMode === 'target' && (
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-[10px]">Target Size (KB)</Label>
                      <input
                        type="number"
                        value={targetSizeKB}
                        onChange={(e) => {
                          setTargetSizeKB(parseInt(e.target.value) || 0)
                          setConvertedUrl('')
                        }}
                        className="bg-secondary border-border text-foreground w-full rounded-md border px-3 py-1.5 font-mono text-xs outline-none"
                      />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="bg-primary/10 border-primary/20 rounded-xl border p-4">
                  <Label className="text-primary mb-2 block text-[11px] font-bold tracking-wider uppercase">
                    Universal Compression
                  </Label>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Detected as{' '}
                    <span className="text-foreground font-medium">{sourceType || 'Unknown'}</span>.
                    Compression will use{' '}
                    <span className="text-foreground font-medium">ZIP (Deflate)</span> to optimize
                    storage.
                  </p>
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-[10px] italic">
                  <Zap className="h-3 w-3" />
                  Maximum compression level applied (Level 9).
                </div>
              </div>
            )}

            <Button
              className="h-12 w-full font-bold"
              disabled={!sourceName || isProcessing}
              onClick={() => {
                void handleOptimize()
              }}
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Optimize File
                </>
              )}
            </Button>
          </div>

          {convertedUrl && (
            <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4 rounded-2xl border border-green-500/20 bg-green-500/10 p-5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-bold text-green-500">Ready for download!</span>
              </div>
              <div className="text-muted-foreground flex justify-between font-mono text-xs">
                <div className="space-y-1">
                  <p>Original</p>
                  <p className="text-foreground">{formatSize(sourceSize)}</p>
                </div>
                <div className="space-y-1 text-center">
                  <p>{reduction > 0 ? 'Reduced' : reduction < 0 ? 'Increased' : 'No Change'}</p>
                  <p className={reduction >= 0 ? 'text-foreground' : 'text-red-400'}>
                    {reduction > 0
                      ? `-${reduction}%`
                      : reduction < 0
                        ? `+${Math.abs(reduction)}%`
                        : '0%'}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p>Current</p>
                  <p className="text-foreground">{formatSize(convertedSize)}</p>
                </div>
              </div>
              <Button
                className="w-full gap-2 bg-green-500 font-bold text-white hover:bg-green-600"
                onClick={download}
              >
                <Download className="h-4 w-4" />
                Download Optimized File
              </Button>
            </div>
          )}
        </div>
      </div>
    </ToolLayout>
  )
}
