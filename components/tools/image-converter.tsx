'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  ImageIcon,
  Upload,
  X,
  Download,
  ArrowRight,
  Lock,
  Unlock,
  FolderUp,
  FilePlus,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ToolLayout } from '@/components/tool-layout'
import JSZip from 'jszip'
import Image from 'next/image'

type OutputFormat = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/bmp'

const FORMAT_OPTIONS: { value: OutputFormat; label: string; ext: string }[] = [
  { value: 'image/png', label: 'PNG', ext: 'png' },
  { value: 'image/jpeg', label: 'JPEG', ext: 'jpg' },
  { value: 'image/webp', label: 'WebP', ext: 'webp' },
  { value: 'image/bmp', label: 'BMP', ext: 'bmp' },
]

type FilenameCase = 'original' | 'lowercase' | 'uppercase' | 'camelCase'
type FilenameSpaces = 'keep' | 'remove' | 'underscore' | 'dash'

const MAX_DIMENSION = 16000

interface FileItem {
  id: string
  file: File
  preview: string
  originalWidth: number
  originalHeight: number
  status: 'pending' | 'converting' | 'done' | 'error'
  convertedUrl?: string
  convertedBlob?: Blob
  convertedSize?: number
  error?: string
}

export default function ImageConverterTool() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [outputFormat, setOutputFormat] = useState<OutputFormat>('image/png')
  const [quality, setQuality] = useState(92)

  // Settings for all files
  const [targetWidth, setTargetWidth] = useState<string>('')
  const [targetHeight, setTargetHeight] = useState<string>('')
  const [lockAspectRatio, setLockAspectRatio] = useState(true)
  const [filenamePattern, setFilenamePattern] = useState('[name]-[format]')
  const [filenameCase, setFilenameCase] = useState<FilenameCase>('original')
  const [filenameSpaces, setFilenameSpaces] = useState<FilenameSpaces>('keep')
  const [isConverting, setIsConverting] = useState(false)
  const [globalError, setGlobalError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const activeUrlsRef = useRef<Set<string>>(new Set())
  const isUnmountedRef = useRef(false)

  const createSafeUrl = useCallback((obj: Blob | MediaSource) => {
    if (isUnmountedRef.current) return ''
    const url = URL.createObjectURL(obj)
    activeUrlsRef.current.add(url)
    return url
  }, [])

  const revokeSafeUrl = useCallback((url: string) => {
    if (url) {
      URL.revokeObjectURL(url)
      activeUrlsRef.current.delete(url)
    }
  }, [])

  useEffect(() => {
    return () => {
      isUnmountedRef.current = true
      activeUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      activeUrlsRef.current.clear()
    }
  }, [])

  const processFile = (file: File): Promise<FileItem> => {
    return new Promise((resolve) => {
      const dataUrl = createSafeUrl(file)
      const img = new window.Image()
      img.onload = () => {
        resolve({
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          file,
          preview: dataUrl,
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight,
          status: 'pending',
        })
      }
      img.onerror = () => {
        revokeSafeUrl(dataUrl)
        resolve({
          id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          file,
          preview: '',
          originalWidth: 0,
          originalHeight: 0,
          status: 'error',
          error: 'Failed to load image',
        })
      }
      img.src = dataUrl
    })
  }

  const handleFiles = async (newFiles: File[]) => {
    setGlobalError('')
    const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
    const validImageFiles = newFiles.filter((f) => /^image\//i.test(f.type))
    const imageFiles = validImageFiles.filter((f) => f.size <= MAX_FILE_SIZE)

    let errorMessage = ''

    if (imageFiles.length === 0) {
      setGlobalError('No valid image files under 50MB selected.')
      return
    }

    if (validImageFiles.length < newFiles.length) {
      errorMessage += `Skipped ${newFiles.length - validImageFiles.length} non-image file(s). `
    }

    if (imageFiles.length < validImageFiles.length) {
      errorMessage += `Skipped ${validImageFiles.length - imageFiles.length} file(s) exceeding 50MB limit. `
    }

    const MAX_FILES = 500
    const filesToProcess = imageFiles.slice(0, MAX_FILES)
    if (imageFiles.length > MAX_FILES) {
      errorMessage += `Maximum ${MAX_FILES} images allowed. `
    }

    if (errorMessage) {
      setGlobalError(errorMessage.trim())
    }

    const batchSize = 50
    for (let i = 0; i < filesToProcess.length; i += batchSize) {
      const batch = filesToProcess.slice(i, i + batchSize)
      const processedFiles = await Promise.all(batch.map(processFile))
      setFiles((prev) => [...prev, ...processedFiles])
      // Yield to event loop to keep UI responsive
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()

    if (!e.dataTransfer.items) {
      const droppedFiles = Array.from(e.dataTransfer.files)
      void handleFiles(droppedFiles)
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getFilesFromEntry = async (entry: any): Promise<File[]> => {
      if (entry.isFile) {
        return new Promise((resolve) => {
          entry.file((file: File) => resolve([file]))
        })
      } else if (entry.isDirectory) {
        return new Promise((resolve) => {
          const dirReader = entry.createReader()
          let files: File[] = []

          const readNext = () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            dirReader.readEntries(async (entries: any[]) => {
              if (entries.length === 0) {
                resolve(files)
              } else {
                for (const subEntry of entries) {
                  const subFiles = await getFilesFromEntry(subEntry)
                  files = [...files, ...subFiles]
                }
                readNext()
              }
            })
          }

          readNext()
        })
      }
      return []
    }

    const processItems = async () => {
      let allFiles: File[] = []
      const items = Array.from(e.dataTransfer.items)
      for (const item of items) {
        if (item.kind === 'file') {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const entry = (item as any).webkitGetAsEntry?.()
          if (entry) {
            const files = await getFilesFromEntry(entry)
            allFiles = [...allFiles, ...files]
          } else {
            const file = item.getAsFile()
            if (file) allFiles.push(file)
          }
        }
      }
      void handleFiles(allFiles)
    }

    void processItems()
  }, [])

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id)
      if (fileToRemove) {
        if (fileToRemove.preview) revokeSafeUrl(fileToRemove.preview)
        if (fileToRemove.convertedUrl) revokeSafeUrl(fileToRemove.convertedUrl)
      }
      return prev.filter((f) => f.id !== id)
    })
  }

  const clearAll = () => {
    files.forEach((f) => {
      if (f.preview) revokeSafeUrl(f.preview)
      if (f.convertedUrl) revokeSafeUrl(f.convertedUrl)
    })
    setFiles([])
    setGlobalError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (folderInputRef.current) folderInputRef.current.value = ''
  }

  const convertSingle = async (item: FileItem): Promise<FileItem> => {
    if (item.status === 'error' || !item.preview) return item

    return new Promise((resolve) => {
      const img = new window.Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')

        let tw = parseInt(targetWidth) || img.naturalWidth || 800
        let th = parseInt(targetHeight) || img.naturalHeight || 800

        if (lockAspectRatio) {
          const nw = img.naturalWidth || 800
          const nh = img.naturalHeight || 800
          if (parseInt(targetWidth) && !parseInt(targetHeight)) {
            th = Math.round((tw * nh) / nw)
          } else if (!parseInt(targetWidth) && parseInt(targetHeight)) {
            tw = Math.round((th * nw) / nh)
          }
        }

        tw = Math.max(1, Math.min(tw, MAX_DIMENSION))
        th = Math.max(1, Math.min(th, MAX_DIMENSION))

        canvas.width = tw
        canvas.height = th
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve({ ...item, status: 'error', error: 'Canvas context not available' })
          return
        }

        if (outputFormat === 'image/jpeg') {
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        const q = outputFormat === 'image/png' ? undefined : quality / 100
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve({ ...item, status: 'error', error: 'Failed to convert image' })
              return
            }
            const url = createSafeUrl(blob)
            resolve({
              ...item,
              status: 'done',
              convertedUrl: url,
              convertedBlob: blob,
              convertedSize: blob.size,
            })
          },
          outputFormat,
          q,
        )
      }
      img.onerror = () =>
        resolve({ ...item, status: 'error', error: 'Failed to load image for conversion' })
      img.src = item.preview
    })
  }

  const convertAll = async () => {
    if (files.length === 0) return
    setIsConverting(true)
    setGlobalError('')

    setFiles((prev) =>
      prev.map((f) => {
        if (f.status === 'error') return f
        if (f.convertedUrl) revokeSafeUrl(f.convertedUrl)
        return {
          ...f,
          status: 'converting',
          error: undefined,
          convertedUrl: undefined,
          convertedBlob: undefined,
          convertedSize: undefined,
        }
      }),
    )

    const newFiles = [...files]
    for (let i = 0; i < newFiles.length; i++) {
      if (newFiles[i].status === 'error') continue

      const result = await convertSingle(newFiles[i])

      setFiles((current) => {
        const exists = current.some((f) => f.id === result.id)
        if (!exists) {
          if (result.convertedUrl) revokeSafeUrl(result.convertedUrl)
          return current
        }
        return current.map((f) => (f.id === result.id ? result : f))
      })
    }

    setIsConverting(false)
  }

  const formatFilename = (originalName: string, index: number, width: number, height: number) => {
    const nameWithoutExt = originalName.replace(/\.[^.]+$/, '')
    const extMatch = originalName.match(/\.([^.]+)$/)
    const ext = extMatch ? extMatch[1] : ''
    const format = FORMAT_OPTIONS.find((f) => f.value === outputFormat)?.ext ?? 'png'

    let result = filenamePattern || '[name]'
    result = result.replace(/\[name\]/g, nameWithoutExt)
    result = result.replace(/\[ext\]/g, ext)
    result = result.replace(/\[format\]/g, format)
    result = result.replace(/\[index\]/g, (index + 1).toString())
    result = result.replace(/\[width\]/g, width.toString())
    result = result.replace(/\[height\]/g, height.toString())

    let finalResult = result

    // 1. Text Case
    if (filenameCase === 'lowercase') {
      finalResult = finalResult.toLowerCase()
    } else if (filenameCase === 'uppercase') {
      finalResult = finalResult.toUpperCase()
    } else if (filenameCase === 'camelCase') {
      finalResult = finalResult
        .toLowerCase()
        .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    }

    // 2. Spaces
    if (filenameCase !== 'camelCase') {
      if (filenameSpaces === 'remove') {
        finalResult = finalResult.replace(/\s+/g, '')
      } else if (filenameSpaces === 'underscore') {
        finalResult = finalResult.replace(/\s+/g, '_')
      } else if (filenameSpaces === 'dash') {
        finalResult = finalResult.replace(/\s+/g, '-')
      }
    }

    // 3. Sanitize OS illegal characters
    finalResult = finalResult.replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    if (!finalResult.trim()) finalResult = 'image'

    return `${finalResult}.${format}`
  }

  const downloadAll = async () => {
    const doneFiles = files.filter((f) => f.status === 'done' && f.convertedUrl)
    if (doneFiles.length === 0) return

    if (doneFiles.length === 1) {
      const file = doneFiles[0]
      const tw = parseInt(targetWidth) || file.originalWidth
      const th = parseInt(targetHeight) || file.originalHeight
      const filename = formatFilename(file.file.name, 0, tw, th)

      const a = document.createElement('a')
      a.href = file.convertedUrl!
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      return
    }

    const zip = new JSZip()
    const folder = zip.folder('converted_images')
    if (!folder) return

    const usedNames = new Set<string>()

    doneFiles.forEach((file, index) => {
      const tw = parseInt(targetWidth) || file.originalWidth
      const th = parseInt(targetHeight) || file.originalHeight
      let filename = formatFilename(file.file.name, index, tw, th)

      let baseName = filename.substring(0, filename.lastIndexOf('.')) || filename
      const extMatch = filename.match(/\.[^.]+$/)
      const ext = extMatch ? extMatch[0] : ''
      let counter = 1

      while (usedNames.has(filename)) {
        filename = `${baseName}(${counter})${ext}`
        counter++
      }
      usedNames.add(filename)

      if (file.convertedBlob) {
        folder.file(filename, file.convertedBlob)
      }
    })

    try {
      const content = await zip.generateAsync({ type: 'blob' })
      const url = createSafeUrl(content)
      const a = document.createElement('a')
      a.href = url
      a.download = 'converted_images.zip'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      setGlobalError('Failed to generate ZIP file')
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <ToolLayout
      title="Image Format Converter"
      description="Batch convert images between PNG, JPEG, WebP, and BMP formats"
      icon={ImageIcon}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.svg"
        onChange={(e) => {
          if (e.target.files) {
            void handleFiles(Array.from(e.target.files))
            e.target.value = ''
          }
        }}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error - webkitdirectory is non-standard but supported
        webkitdirectory="true"
        directory="true"
        multiple
        onChange={(e) => {
          if (e.target.files) {
            void handleFiles(Array.from(e.target.files))
            e.target.value = ''
          }
        }}
        className="hidden"
      />

      {files.length === 0 ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-border bg-secondary/30 text-muted-foreground hover:border-primary/40 hover:bg-secondary/50 flex flex-col items-center justify-center gap-6 rounded-xl border-2 border-dashed px-6 py-20 transition-colors"
        >
          <div className="bg-primary/10 text-primary flex h-16 w-16 items-center justify-center rounded-full">
            <Upload className="h-8 w-8" />
          </div>
          <div className="text-center">
            <p className="text-foreground text-base font-medium">Drop images or folders here</p>
            <p className="mt-2 text-sm">Supports PNG, JPG, GIF, WebP, SVG, BMP</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="secondary"
              className="w-full gap-2 font-medium sm:w-auto"
            >
              <FilePlus className="h-4 w-4" />
              Select Files
            </Button>
            <Button
              onClick={() => folderInputRef.current?.click()}
              variant="secondary"
              className="w-full gap-2 font-medium sm:w-auto"
            >
              <FolderUp className="h-4 w-4" />
              Select Folder
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid min-w-0 gap-6 lg:grid-cols-[1fr_300px]">
          <div className="order-2 flex min-w-0 flex-col gap-4 lg:order-1">
            <div className="flex items-center justify-between">
              <h3 className="text-foreground font-semibold">Queued Files ({files.length})</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-muted-foreground hover:bg-destructive/10 dark:hover:bg-destructive/10 hover:text-destructive h-8 text-xs"
              >
                Clear All
              </Button>
            </div>

            <div className="border-border bg-card/50 flex max-h-[500px] flex-col gap-2 overflow-y-auto rounded-lg border p-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="border-border bg-background hover:bg-secondary/20 flex items-center gap-3 rounded-md border p-2 text-sm shadow-sm transition-colors"
                >
                  <div className="bg-secondary/50 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded">
                    {file.preview ? (
                      <Image
                        src={file.preview}
                        alt=""
                        width={40}
                        height={40}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="text-muted-foreground h-5 w-5" />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-medium" title={file.file.name}>
                      {file.file.name}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {formatBytes(file.file.size)} &middot; {file.originalWidth}x
                      {file.originalHeight}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 pl-2">
                    {file.status === 'pending' && (
                      <span className="text-muted-foreground text-xs">Pending</span>
                    )}
                    {file.status === 'converting' && (
                      <Loader2 className="text-primary h-4 w-4 animate-spin" />
                    )}
                    {file.status === 'done' && (
                      <div className="flex flex-col items-end">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-[10px] text-green-500">
                          {formatBytes(file.convertedSize || 0)}
                        </span>
                      </div>
                    )}
                    {file.status === 'error' && (
                      <span title={file.error}>
                        <AlertCircle className="text-destructive h-4 w-4" />
                      </span>
                    )}

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:bg-destructive/10 dark:hover:bg-destructive/10 hover:text-destructive h-7 w-7"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-border bg-secondary/20 order-1 flex min-w-0 flex-col gap-6 rounded-xl border p-5 lg:order-2">
            <h3 className="text-foreground font-semibold">Conversion Settings</h3>

            <div className="flex flex-col gap-3">
              <Label className="text-muted-foreground text-xs font-semibold">Output Format</Label>
              <div className="grid grid-cols-2 gap-2">
                {FORMAT_OPTIONS.map((fmt) => (
                  <button
                    key={fmt.value}
                    onClick={() => setOutputFormat(fmt.value)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                      outputFormat === fmt.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {(outputFormat === 'image/jpeg' || outputFormat === 'image/webp') && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground text-xs font-semibold">Quality</Label>
                  <span className="text-foreground font-mono text-xs">{quality}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="bg-secondary accent-primary h-2 w-full cursor-pointer appearance-none rounded-lg"
                />
              </div>
            )}

            <div className="flex flex-col gap-3">
              <Label className="text-muted-foreground text-xs font-semibold">
                Resize (Optional)
              </Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label className="text-muted-foreground text-[10px]">Width (px)</Label>
                  <input
                    type="number"
                    min="1"
                    value={targetWidth}
                    placeholder="Auto"
                    onChange={(e) => {
                      setTargetWidth(e.target.value)
                      if (lockAspectRatio) setTargetHeight('')
                    }}
                    className="bg-background border-border text-foreground focus:border-primary/50 w-full rounded-md border px-3 py-2 font-mono text-xs outline-none"
                  />
                </div>
                <button
                  type="button"
                  title={lockAspectRatio ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
                  className={`mt-5 flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                    lockAspectRatio
                      ? 'bg-primary/10 text-primary hover:bg-primary/20'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                  onClick={() => {
                    const newLock = !lockAspectRatio
                    setLockAspectRatio(newLock)
                    if (newLock && targetWidth && targetHeight) {
                      setTargetHeight('')
                    }
                  }}
                >
                  {lockAspectRatio ? (
                    <Lock className="h-3.5 w-3.5" />
                  ) : (
                    <Unlock className="h-3.5 w-3.5" />
                  )}
                </button>
                <div className="flex-1 space-y-1.5">
                  <Label className="text-muted-foreground text-[10px]">Height (px)</Label>
                  <input
                    type="number"
                    min="1"
                    value={targetHeight}
                    placeholder="Auto"
                    onChange={(e) => {
                      setTargetHeight(e.target.value)
                      if (lockAspectRatio) setTargetWidth('')
                    }}
                    className="bg-background border-border text-foreground focus:border-primary/50 w-full rounded-md border px-3 py-2 font-mono text-xs outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">
                <Label className="text-muted-foreground text-xs font-semibold">
                  Filename Pattern
                </Label>
                <div className="flex w-full gap-2">
                  <select
                    value={filenameCase}
                    onChange={(e) => setFilenameCase(e.target.value as FilenameCase)}
                    className="bg-secondary border-border text-foreground hover:bg-secondary/80 flex-1 cursor-pointer rounded border px-2 py-1 text-[10px] outline-none"
                  >
                    <option value="original">Original Case</option>
                    <option value="lowercase">lowercase</option>
                    <option value="uppercase">UPPERCASE</option>
                    <option value="camelCase">camelCase</option>
                  </select>
                  <select
                    value={filenameSpaces}
                    onChange={(e) => setFilenameSpaces(e.target.value as FilenameSpaces)}
                    disabled={filenameCase === 'camelCase'}
                    className="bg-secondary border-border text-foreground hover:bg-secondary/80 flex-1 cursor-pointer rounded border px-2 py-1 text-[10px] outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="keep">Keep Spaces</option>
                    <option value="remove">Remove Spaces</option>
                    <option value="underscore">Spaces to _</option>
                    <option value="dash">Spaces to -</option>
                  </select>
                </div>
              </div>
              <input
                type="text"
                value={filenamePattern}
                onChange={(e) => setFilenamePattern(e.target.value)}
                className="bg-background border-border text-foreground focus:border-primary/50 w-full rounded-md border px-3 py-2 font-mono text-xs outline-none"
                placeholder="[name]-[format]"
              />
              <div className="flex flex-wrap gap-1.5">
                {['[name]', '[ext]', '[format]', '[index]', '[width]', '[height]'].map(
                  (variable) => (
                    <button
                      key={variable}
                      onClick={() => setFilenamePattern((prev) => prev + variable)}
                      className="bg-background border-border text-muted-foreground hover:bg-secondary hover:text-foreground rounded border px-1.5 py-0.5 font-mono text-[10px] transition-colors"
                      title={`Click to insert ${variable}`}
                    >
                      {variable}
                    </button>
                  ),
                )}
              </div>
              <div className="bg-background/50 border-border/50 text-muted-foreground rounded-md border p-2 font-mono text-[10px] break-all">
                Preview:{' '}
                {files.length > 0
                  ? formatFilename(
                      files[0].file.name,
                      0,
                      parseInt(targetWidth) || files[0].originalWidth,
                      parseInt(targetHeight) || files[0].originalHeight,
                    )
                  : formatFilename('example.png', 0, 800, 600)}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <Button
                onClick={() => {
                  void convertAll()
                }}
                disabled={isConverting || files.length === 0}
                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full gap-2"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Converting...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4" /> Convert All
                  </>
                )}
              </Button>

              {files.some((f) => f.status === 'done') && (
                <Button
                  onClick={() => {
                    void downloadAll()
                  }}
                  variant="secondary"
                  className="w-full gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download {files.length > 1 ? 'ZIP' : 'File'}
                </Button>
              )}
            </div>

            {globalError && (
              <div className="bg-destructive/10 text-destructive border-destructive/20 rounded border p-2 text-xs">
                {globalError}
              </div>
            )}
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
