'use client'

import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import {
  Scaling,
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
  AlertTriangle,
  Loader2,
  ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ToolLayout } from '@/components/tool-layout'
import JSZip from 'jszip'
import Image from 'next/image'

const ACCEPTED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp'])
const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

type FilenameCase = 'original' | 'lowercase' | 'uppercase' | 'camelCase'
type FilenameSpaces = 'keep' | 'remove' | 'underscore' | 'dash'
type SizeMode = 'pixels' | 'percentage'

const MAX_DIMENSION = 16000

interface AnchorPoint {
  id: string
  x: number
  y: number
  label: string
}

const ANCHOR_GRID: AnchorPoint[] = [
  { id: 'top-left', x: 0, y: 0, label: 'Top Left' },
  { id: 'top-center', x: 0.5, y: 0, label: 'Top Center' },
  { id: 'top-right', x: 1, y: 0, label: 'Top Right' },
  { id: 'center-left', x: 0, y: 0.5, label: 'Center Left' },
  { id: 'center', x: 0.5, y: 0.5, label: 'Center' },
  { id: 'center-right', x: 1, y: 0.5, label: 'Center Right' },
  { id: 'bottom-left', x: 0, y: 1, label: 'Bottom Left' },
  { id: 'bottom-center', x: 0.5, y: 1, label: 'Bottom Center' },
  { id: 'bottom-right', x: 1, y: 1, label: 'Bottom Right' },
]

interface Preset {
  group: string
  label: string
  mode: SizeMode
  width?: number
  height?: number
  percentage?: number
}

const PRESET_GROUPS = ['Percentage', 'Common Screens', 'Social Media', 'LINE OA'] as const

const PRESETS: Preset[] = [
  { group: 'Percentage', label: '25%', mode: 'percentage', percentage: 25 },
  { group: 'Percentage', label: '50%', mode: 'percentage', percentage: 50 },
  { group: 'Percentage', label: '75%', mode: 'percentage', percentage: 75 },
  { group: 'Common Screens', label: 'HD (1280×720)', mode: 'pixels', width: 1280, height: 720 },
  {
    group: 'Common Screens',
    label: 'Full HD (1920×1080)',
    mode: 'pixels',
    width: 1920,
    height: 1080,
  },
  { group: 'Common Screens', label: '2K (2560×1440)', mode: 'pixels', width: 2560, height: 1440 },
  {
    group: 'Common Screens',
    label: '4K UHD (3840×2160)',
    mode: 'pixels',
    width: 3840,
    height: 2160,
  },
  {
    group: 'Social Media',
    label: 'Instagram Square (1080×1080)',
    mode: 'pixels',
    width: 1080,
    height: 1080,
  },
  {
    group: 'Social Media',
    label: 'Instagram Portrait (1080×1350)',
    mode: 'pixels',
    width: 1080,
    height: 1350,
  },
  {
    group: 'Social Media',
    label: 'Instagram Story/Reel (1080×1920)',
    mode: 'pixels',
    width: 1080,
    height: 1920,
  },
  {
    group: 'Social Media',
    label: 'Facebook Post (1200×630)',
    mode: 'pixels',
    width: 1200,
    height: 630,
  },
  {
    group: 'Social Media',
    label: 'Facebook Cover (820×312)',
    mode: 'pixels',
    width: 820,
    height: 312,
  },
  {
    group: 'Social Media',
    label: 'X / Twitter Post (1200×675)',
    mode: 'pixels',
    width: 1200,
    height: 675,
  },
  {
    group: 'Social Media',
    label: 'LinkedIn Post (1200×627)',
    mode: 'pixels',
    width: 1200,
    height: 627,
  },
  {
    group: 'Social Media',
    label: 'LinkedIn Cover (1584×396)',
    mode: 'pixels',
    width: 1584,
    height: 396,
  },
  {
    group: 'Social Media',
    label: 'YouTube Thumbnail (1280×720)',
    mode: 'pixels',
    width: 1280,
    height: 720,
  },
  { group: 'LINE OA', label: 'Profile (640×640)', mode: 'pixels', width: 640, height: 640 },
  { group: 'LINE OA', label: 'Cover (1080×878)', mode: 'pixels', width: 1080, height: 878 },
  {
    group: 'LINE OA',
    label: 'Rich Menu Large (2500×1686)',
    mode: 'pixels',
    width: 2500,
    height: 1686,
  },
  {
    group: 'LINE OA',
    label: 'Rich Menu Small (2500×843)',
    mode: 'pixels',
    width: 2500,
    height: 843,
  },
  {
    group: 'LINE OA',
    label: 'Rich Message Square (1040×1040)',
    mode: 'pixels',
    width: 1040,
    height: 1040,
  },
]

interface FileItem {
  id: string
  file: File
  preview: string
  originalWidth: number
  originalHeight: number
  status: 'pending' | 'processing' | 'done' | 'error'
  resizedUrl?: string
  resizedBlob?: Blob
  resizedSize?: number
  resizedWidth?: number
  resizedHeight?: number
  error?: string
}

function drawResizedToCanvas(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  ow: number,
  oh: number,
  tw: number,
  th: number,
  anchor: AnchorPoint,
  fillWhite: boolean,
) {
  canvas.width = tw
  canvas.height = th
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  if (fillWhite) {
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, tw, th)
  }

  const scale = Math.max(tw / ow, th / oh)
  const srcW = Math.min(ow, tw / scale)
  const srcH = Math.min(oh, th / scale)
  const srcX = Math.max(0, Math.min(ow - srcW, (ow - srcW) * anchor.x))
  const srcY = Math.max(0, Math.min(oh - srcH, (oh - srcH) * anchor.y))

  ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, tw, th)
  return ctx
}

export default function ImageResizerTool() {
  const [files, setFiles] = useState<FileItem[]>([])
  const [quality, setQuality] = useState(92)

  const [sizeMode, setSizeMode] = useState<SizeMode>('pixels')
  const [targetWidth, setTargetWidth] = useState<string>('')
  const [targetHeight, setTargetHeight] = useState<string>('')
  const [lockAspectRatio, setLockAspectRatio] = useState(true)
  const [percentage, setPercentage] = useState('100')
  const [anchorId, setAnchorId] = useState('center')
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<string>('')
  const [previewFileId, setPreviewFileId] = useState<string>('')

  const [filenamePattern, setFilenamePattern] = useState('[name]-[width]x[height]')
  const [filenameCase, setFilenameCase] = useState<FilenameCase>('original')
  const [filenameSpaces, setFilenameSpaces] = useState<FilenameSpaces>('keep')
  const [isProcessing, setIsProcessing] = useState(false)
  const [globalError, setGlobalError] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  const activeUrlsRef = useRef<Set<string>>(new Set())
  const isUnmountedRef = useRef(false)
  const imgCacheRef = useRef<Map<string, HTMLImageElement>>(new Map())

  const anchor = useMemo(
    () => ANCHOR_GRID.find((a) => a.id === anchorId) ?? ANCHOR_GRID[4],
    [anchorId],
  )

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
    isUnmountedRef.current = false
    return () => {
      isUnmountedRef.current = true
      activeUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
      activeUrlsRef.current.clear()
      imgCacheRef.current.clear()
    }
  }, [])

  const computeTargetDims = useCallback(
    (ow: number, oh: number) => {
      let tw: number
      let th: number

      if (sizeMode === 'percentage') {
        const pct = Math.min(1000, Math.max(1, parseFloat(percentage) || 100)) / 100
        tw = ow * pct
        th = oh * pct
      } else {
        const hasW = parseInt(targetWidth) > 0
        const hasH = parseInt(targetHeight) > 0
        tw = hasW ? parseInt(targetWidth) : ow
        th = hasH ? parseInt(targetHeight) : oh

        if (lockAspectRatio) {
          if (hasW && !hasH) th = (tw * oh) / ow
          else if (!hasW && hasH) tw = (th * ow) / oh
        }
      }

      const scale = Math.min(1, MAX_DIMENSION / tw, MAX_DIMENSION / th)
      tw = Math.max(1, Math.round(tw * scale))
      th = Math.max(1, Math.round(th * scale))
      return { tw, th }
    },
    [sizeMode, percentage, targetWidth, targetHeight, lockAspectRatio],
  )

  const processFile = (file: File): Promise<FileItem> => {
    return new Promise((resolve) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 9)
      const dataUrl = createSafeUrl(file)
      const img = new window.Image()
      img.onload = () => {
        imgCacheRef.current.set(id, img)
        resolve({
          id,
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
          id,
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
    const MAX_FILE_SIZE = 50 * 1024 * 1024

    const supportedFiles = newFiles.filter((f) => ACCEPTED_MIME_TYPES.has(f.type))
    const imageFiles = supportedFiles.filter((f) => f.size <= MAX_FILE_SIZE)

    let errorMessage = ''

    if (imageFiles.length === 0) {
      setGlobalError('No supported images selected. Only PNG, JPEG, and WebP are supported.')
      return
    }

    if (supportedFiles.length < newFiles.length) {
      errorMessage += `Skipped ${newFiles.length - supportedFiles.length} unsupported file(s) (only PNG, JPEG, WebP). `
    }

    if (imageFiles.length < supportedFiles.length) {
      errorMessage += `Skipped ${supportedFiles.length - imageFiles.length} file(s) exceeding 50MB limit. `
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
        if (fileToRemove.resizedUrl) revokeSafeUrl(fileToRemove.resizedUrl)
      }
      imgCacheRef.current.delete(id)
      return prev.filter((f) => f.id !== id)
    })
  }

  const clearAll = () => {
    files.forEach((f) => {
      if (f.preview) revokeSafeUrl(f.preview)
      if (f.resizedUrl) revokeSafeUrl(f.resizedUrl)
    })
    imgCacheRef.current.clear()
    setFiles([])
    setPreviewFileId('')
    setGlobalError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (folderInputRef.current) folderInputRef.current.value = ''
  }

  const resizeSingle = async (item: FileItem): Promise<FileItem> => {
    if (item.status === 'error' || !item.preview) return item
    const img = imgCacheRef.current.get(item.id)
    if (!img) return { ...item, status: 'error', error: 'Image not loaded' }

    const { tw, th } = computeTargetDims(item.originalWidth, item.originalHeight)
    const canvas = document.createElement('canvas')
    const ctx = drawResizedToCanvas(
      canvas,
      img,
      item.originalWidth,
      item.originalHeight,
      tw,
      th,
      anchor,
      item.file.type === 'image/jpeg',
    )
    if (!ctx) return { ...item, status: 'error', error: 'Canvas context not available' }

    const mime = item.file.type
    const q = mime === 'image/png' ? undefined : quality / 100

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({ ...item, status: 'error', error: 'Failed to resize image' })
            return
          }
          const url = createSafeUrl(blob)
          resolve({
            ...item,
            status: 'done',
            resizedUrl: url,
            resizedBlob: blob,
            resizedSize: blob.size,
            resizedWidth: tw,
            resizedHeight: th,
          })
        },
        mime,
        q,
      )
    })
  }

  const resizeAll = async () => {
    if (files.length === 0) return
    setIsProcessing(true)
    setGlobalError('')

    setFiles((prev) =>
      prev.map((f) => {
        if (f.status === 'error') return f
        if (f.resizedUrl) revokeSafeUrl(f.resizedUrl)
        return {
          ...f,
          status: 'processing',
          error: undefined,
          resizedUrl: undefined,
          resizedBlob: undefined,
          resizedSize: undefined,
          resizedWidth: undefined,
          resizedHeight: undefined,
        }
      }),
    )

    const newFiles = [...files]
    for (let i = 0; i < newFiles.length; i++) {
      if (newFiles[i].status === 'error') continue

      const result = await resizeSingle(newFiles[i])

      setFiles((current) => {
        const exists = current.some((f) => f.id === result.id)
        if (!exists) {
          if (result.resizedUrl) revokeSafeUrl(result.resizedUrl)
          return current
        }
        return current.map((f) => (f.id === result.id ? result : f))
      })
    }

    setIsProcessing(false)
  }

  const formatFilename = (
    originalName: string,
    index: number,
    width: number,
    height: number,
    mimeType: string,
  ) => {
    const nameWithoutExt = originalName.replace(/\.[^.]+$/, '')
    const ext = EXT_BY_MIME[mimeType] || 'png'

    const tokenValues: Record<string, string> = {
      name: nameWithoutExt,
      ext,
      index: (index + 1).toString(),
      width: width.toString(),
      height: height.toString(),
    }
    const result = (filenamePattern || '[name]').replace(
      /\[(name|ext|index|width|height)\]/g,
      (_match, token: string) => tokenValues[token],
    )

    let finalResult = result

    if (filenameCase === 'lowercase') {
      finalResult = finalResult.toLowerCase()
    } else if (filenameCase === 'uppercase') {
      finalResult = finalResult.toUpperCase()
    } else if (filenameCase === 'camelCase') {
      finalResult = finalResult
        .toLowerCase()
        .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    }

    if (filenameCase !== 'camelCase') {
      if (filenameSpaces === 'remove') {
        finalResult = finalResult.replace(/\s+/g, '')
      } else if (filenameSpaces === 'underscore') {
        finalResult = finalResult.replace(/\s+/g, '_')
      } else if (filenameSpaces === 'dash') {
        finalResult = finalResult.replace(/\s+/g, '-')
      }
    }

    finalResult = finalResult.replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
    if (!finalResult.trim()) finalResult = 'image'

    return `${finalResult}.${ext}`
  }

  const downloadAll = async () => {
    const doneFiles = files.filter((f) => f.status === 'done' && f.resizedUrl)
    if (doneFiles.length === 0) return

    if (doneFiles.length === 1) {
      const file = doneFiles[0]
      const filename = formatFilename(
        file.file.name,
        0,
        file.resizedWidth || file.originalWidth,
        file.resizedHeight || file.originalHeight,
        file.file.type,
      )

      const a = document.createElement('a')
      a.href = file.resizedUrl!
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      return
    }

    const zip = new JSZip()
    const folder = zip.folder('resized_images')
    if (!folder) return

    const usedNames = new Set<string>()

    doneFiles.forEach((file, index) => {
      let filename = formatFilename(
        file.file.name,
        index,
        file.resizedWidth || file.originalWidth,
        file.resizedHeight || file.originalHeight,
        file.file.type,
      )

      const baseName = filename.substring(0, filename.lastIndexOf('.')) || filename
      const extMatch = filename.match(/\.[^.]+$/)
      const ext = extMatch ? extMatch[0] : ''
      let counter = 1

      while (usedNames.has(filename)) {
        filename = `${baseName}(${counter})${ext}`
        counter++
      }
      usedNames.add(filename)

      if (file.resizedBlob) {
        folder.file(filename, file.resizedBlob)
      }
    })

    try {
      const content = await zip.generateAsync({ type: 'blob' })
      const url = createSafeUrl(content)
      const a = document.createElement('a')
      a.href = url
      a.download = 'resized_images.zip'
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

  const applyPreset = (index: number) => {
    const preset = PRESETS[index]
    if (!preset) return
    setSelectedPresetIndex(String(index))
    if (preset.mode === 'percentage') {
      setSizeMode('percentage')
      setPercentage(String(preset.percentage))
    } else {
      setSizeMode('pixels')
      setTargetWidth(String(preset.width))
      setTargetHeight(String(preset.height))
    }
  }

  const previewFile = useMemo(() => {
    const selected = previewFileId ? files.find((f) => f.id === previewFileId) : undefined
    if (selected && selected.status !== 'error') return selected
    return files.find((f) => f.status !== 'error')
  }, [files, previewFileId])

  const previewDims = useMemo(() => {
    if (!previewFile) return null
    return computeTargetDims(previewFile.originalWidth, previewFile.originalHeight)
  }, [previewFile, computeTargetDims])

  useEffect(() => {
    const canvas = previewCanvasRef.current
    if (!previewFile || !canvas || !previewDims) return
    const img = imgCacheRef.current.get(previewFile.id)
    if (!img) return

    drawResizedToCanvas(
      canvas,
      img,
      previewFile.originalWidth,
      previewFile.originalHeight,
      previewDims.tw,
      previewDims.th,
      anchor,
      previewFile.file.type === 'image/jpeg',
    )
  }, [previewFile, previewDims, anchor])

  const hasLossyFiles = files.some(
    (f) => f.file.type === 'image/jpeg' || f.file.type === 'image/webp',
  )

  const upscaleWarning = useMemo(() => {
    if (files.length === 0) return null
    const affected = files.filter((f) => {
      if (f.status === 'error') return false
      const { tw, th } = computeTargetDims(f.originalWidth, f.originalHeight)
      return tw > f.originalWidth || th > f.originalHeight
    })
    if (affected.length === 0) return null
    return `${affected.length} image${affected.length > 1 ? 's' : ''} will be enlarged beyond ${affected.length > 1 ? 'their' : 'its'} original size — this may reduce quality.`
  }, [files, computeTargetDims])

  const previewNeedsCrop =
    previewFile &&
    previewDims &&
    Math.abs(
      previewDims.tw / previewDims.th - previewFile.originalWidth / previewFile.originalHeight,
    ) > 0.01

  return (
    <ToolLayout
      title="Image Resizer"
      description="Batch resize images to exact pixel dimensions, a percentage, or ready-made presets — format is always preserved"
      icon={Scaling}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/png,image/jpeg,image/webp"
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
            <p className="mt-2 text-sm">Supports PNG, JPEG, WebP</p>
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
            {previewFile && previewDims && (
              <div className="border-border bg-secondary/20 flex min-w-0 flex-col gap-3 rounded-xl border p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-foreground text-sm font-semibold">Preview</h3>
                  <span
                    className="text-muted-foreground max-w-[55%] truncate text-xs"
                    title={previewFile.file.name}
                  >
                    {previewFile.file.name}
                  </span>
                </div>

                {upscaleWarning && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/10 p-2 text-xs text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{upscaleWarning}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-muted-foreground text-[10px]">Before</Label>
                    <div className="border-border bg-background flex aspect-square items-center justify-center overflow-hidden rounded-lg border">
                      <Image
                        src={previewFile.preview}
                        alt=""
                        width={300}
                        height={300}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-muted-foreground text-[10px]">After</Label>
                    <div className="border-border bg-background flex aspect-square items-center justify-center overflow-hidden rounded-lg border">
                      <canvas ref={previewCanvasRef} className="h-full w-full object-contain" />
                    </div>
                  </div>
                </div>

                <div className="text-muted-foreground font-mono text-[10px]">
                  {previewFile.originalWidth}×{previewFile.originalHeight} → {previewDims.tw}×
                  {previewDims.th}
                  {previewNeedsCrop && ' (cropped to fill)'}
                </div>
              </div>
            )}

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
                <button
                  key={file.id}
                  type="button"
                  onClick={() => setPreviewFileId(file.id)}
                  className={`border-border bg-background hover:bg-secondary/20 flex items-center gap-3 rounded-md border p-2 text-left text-sm shadow-sm transition-colors ${
                    previewFile?.id === file.id ? 'ring-primary ring-2' : ''
                  }`}
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
                      {file.status === 'done' &&
                        file.resizedWidth &&
                        ` → ${file.resizedWidth}x${file.resizedHeight}`}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 pl-2">
                    {file.status === 'pending' && (
                      <span className="text-muted-foreground text-xs">Pending</span>
                    )}
                    {file.status === 'processing' && (
                      <Loader2 className="text-primary h-4 w-4 animate-spin" />
                    )}
                    {file.status === 'done' && (
                      <div className="flex flex-col items-end">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span className="text-[10px] text-green-500">
                          {formatBytes(file.resizedSize || 0)}
                        </span>
                      </div>
                    )}
                    {file.status === 'error' && (
                      <span title={file.error}>
                        <AlertCircle className="text-destructive h-4 w-4" />
                      </span>
                    )}

                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        removeFile(file.id)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation()
                          removeFile(file.id)
                        }
                      }}
                      className="text-muted-foreground hover:bg-destructive/10 dark:hover:bg-destructive/10 hover:text-destructive flex h-7 w-7 items-center justify-center rounded-md"
                    >
                      <X className="h-4 w-4" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="border-border bg-secondary/20 order-1 flex min-w-0 flex-col gap-6 rounded-xl border p-5 lg:order-2">
            <h3 className="text-foreground font-semibold">Resize Settings</h3>

            <div className="flex flex-col gap-3">
              <Label className="text-muted-foreground text-xs font-semibold">Preset</Label>
              <select
                value={selectedPresetIndex}
                onChange={(e) => {
                  const idx = parseInt(e.target.value)
                  if (!isNaN(idx)) applyPreset(idx)
                }}
                className="bg-background border-border text-foreground focus:border-primary/50 w-full cursor-pointer rounded-md border px-3 py-2 text-xs outline-none"
              >
                <option value="" disabled>
                  Choose a preset…
                </option>
                {PRESET_GROUPS.map((group) => (
                  <optgroup key={group} label={group}>
                    {PRESETS.map((p, i) =>
                      p.group === group ? (
                        <option key={i} value={i}>
                          {p.label}
                        </option>
                      ) : null,
                    )}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-3">
              <Label className="text-muted-foreground text-xs font-semibold">Size Mode</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['pixels', 'percentage'] as SizeMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => {
                      setSizeMode(mode)
                      setSelectedPresetIndex('')
                    }}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                      sizeMode === mode
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    {mode === 'pixels' ? 'Pixels' : 'Percentage'}
                  </button>
                ))}
              </div>
            </div>

            {sizeMode === 'pixels' ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-muted-foreground text-[10px]">Width (px)</Label>
                    <input
                      type="number"
                      min="1"
                      max={MAX_DIMENSION}
                      value={targetWidth}
                      placeholder="Auto"
                      onChange={(e) => {
                        setTargetWidth(e.target.value)
                        if (lockAspectRatio) setTargetHeight('')
                        setSelectedPresetIndex('')
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
                        setSelectedPresetIndex('')
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
                      max={MAX_DIMENSION}
                      value={targetHeight}
                      placeholder="Auto"
                      onChange={(e) => {
                        setTargetHeight(e.target.value)
                        if (lockAspectRatio) setTargetWidth('')
                        setSelectedPresetIndex('')
                      }}
                      className="bg-background border-border text-foreground focus:border-primary/50 w-full rounded-md border px-3 py-2 font-mono text-xs outline-none"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground text-xs font-semibold">Scale</Label>
                  <span className="text-foreground font-mono text-xs">{percentage}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={1000}
                  value={Math.min(1000, Math.max(1, Number(percentage) || 100))}
                  onChange={(e) => {
                    setPercentage(e.target.value)
                    setSelectedPresetIndex('')
                  }}
                  className="bg-secondary accent-primary h-2 w-full cursor-pointer appearance-none rounded-lg"
                />
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={percentage}
                  onChange={(e) => {
                    setPercentage(e.target.value)
                    setSelectedPresetIndex('')
                  }}
                  className="bg-background border-border text-foreground focus:border-primary/50 w-full rounded-md border px-3 py-2 font-mono text-xs outline-none"
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label className="text-muted-foreground text-xs font-semibold">Crop Position</Label>
              <p className="text-muted-foreground text-[10px]">
                Used when the target aspect ratio differs from the original (crop-to-fill).
              </p>
              <div className="border-border bg-background grid w-fit grid-cols-3 gap-1 rounded-md border p-1">
                {ANCHOR_GRID.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    title={a.label}
                    onClick={() => setAnchorId(a.id)}
                    className={`flex h-7 w-7 items-center justify-center rounded transition-colors ${
                      anchorId === a.id
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        anchorId === a.id ? 'bg-primary' : 'bg-muted-foreground/50'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {hasLossyFiles && (
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
                placeholder="[name]-[width]x[height]"
              />
              <div className="flex flex-wrap gap-1.5">
                {['[name]', '[ext]', '[index]', '[width]', '[height]'].map((variable) => (
                  <button
                    key={variable}
                    onClick={() => setFilenamePattern((prev) => prev + variable)}
                    className="bg-background border-border text-muted-foreground hover:bg-secondary hover:text-foreground rounded border px-1.5 py-0.5 font-mono text-[10px] transition-colors"
                    title={`Click to insert ${variable}`}
                  >
                    {variable}
                  </button>
                ))}
              </div>
              <div className="bg-background/50 border-border/50 text-muted-foreground rounded-md border p-2 font-mono text-[10px] break-all">
                Preview:{' '}
                {previewFile && previewDims
                  ? formatFilename(
                      previewFile.file.name,
                      0,
                      previewDims.tw,
                      previewDims.th,
                      previewFile.file.type,
                    )
                  : formatFilename('example.png', 0, 800, 600, 'image/png')}
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <Button
                onClick={() => {
                  void resizeAll()
                }}
                disabled={isProcessing || files.length === 0}
                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Resizing...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4" /> Resize All
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
