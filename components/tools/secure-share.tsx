'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ShieldCheck,
  Upload,
  Lock,
  Unlock,
  Copy,
  CheckCircle2,
  Trash2,
  Loader2,
  FileIcon,
  FolderIcon,
  AlertCircle,
  Download,
  Link2,
  ArrowRight,
  Activity,
  QrCode,
  Scan,
  Check,
  AlertTriangle,
  Eye,
  X,
} from 'lucide-react'
import JSZip from 'jszip'
import QRCode from 'qrcode'
import { toast } from 'sonner'
import QrScanner from 'qr-scanner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ToolLayout } from '@/components/tool-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

if (typeof window !== 'undefined') {
  QrScanner.WORKER_PATH = '/qr-scanner-worker.min.js'
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
]

const MAX_TRANSFER_BYTES = 4 * 1024 * 1024 * 1024
const MAX_QUEUE_BYTES = 4 * 1024 * 1024 * 1024
const MAX_SDP_LENGTH = 65536

const VALID_SDP_TYPES = ['offer', 'answer', 'pranswer', 'rollback'] as const

interface FileItem {
  id: string
  file: File
  path: string
  size: number
}

async function compressSdp(sdpObj: RTCSessionDescriptionInit): Promise<string> {
  const json = JSON.stringify(sdpObj)
  const stream = new Blob([json]).stream()
  const compressedStream = stream.pipeThrough(new CompressionStream('gzip'))
  const response = new Response(compressedStream)
  const buffer = await response.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary)
}

async function decompressSdp(base64Str: string): Promise<RTCSessionDescriptionInit> {
  if (base64Str.length > MAX_SDP_LENGTH) {
    throw new Error('SDP payload too large')
  }
  const binary = atob(base64Str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const stream = new Blob([bytes]).stream()
  const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'))
  const response = new Response(decompressedStream)
  const json = await response.text()
  const parsed = JSON.parse(json) as unknown
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Invalid SDP payload format')
  }
  const obj = parsed as Record<string, unknown>
  if (typeof obj['type'] !== 'string' || !VALID_SDP_TYPES.includes(obj['type'] as never)) {
    throw new Error('Invalid SDP type')
  }
  if (typeof obj['sdp'] !== 'string') {
    throw new Error('Invalid SDP body')
  }
  return { type: obj['type'] as RTCSdpType, sdp: obj['sdp'] }
}

async function computeSha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

function parseQrPayload(rawValue: string): { type: 'offer' | 'answer'; value: string } | null {
  if (rawValue.includes('#offer=')) {
    const value = rawValue.split('#offer=')[1]
    return value ? { type: 'offer', value } : null
  }
  if (rawValue.includes('#answer=')) {
    const value = rawValue.split('#answer=')[1]
    return value ? { type: 'answer', value } : null
  }
  return null
}

function sanitizePath(filename: string): string {
  return filename
    .split(/[/\\]/)
    .filter((part) => part.length > 0 && part !== '.' && part !== '..')
    .join('/')
}

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const mimeMap: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
    mp4: 'video/mp4',
    webm: 'video/webm',
    ogg: 'video/ogg',
    mov: 'video/quicktime',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    aac: 'audio/aac',
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    ts: 'application/typescript',
    json: 'application/json',
    md: 'text/markdown',
    xml: 'application/xml',
    zip: 'application/zip',
  }
  return mimeMap[ext] || 'application/octet-stream'
}

function formatSize(bytes: number): string {
  if (!isFinite(bytes) || bytes < 0) return '0 Bytes'
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1)
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function triggerDownload(url: string, filename: string): void {
  const link = document.createElement('a')
  document.body.appendChild(link)
  link.href = url
  link.download = filename
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function SecureShareTool() {
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send')
  const [files, setFiles] = useState<FileItem[]>([])
  const [isDragOver, setIsDragOver] = useState(false)

  const [loading, setLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState('')

  const [initiatorCode, setInitiatorCode] = useState('')
  const [copiedInitiator, setCopiedInitiator] = useState(false)
  const [recipientResponse, setRecipientResponse] = useState('')

  const [recipientRequest, setRecipientRequest] = useState('')
  const [responseCode, setResponseCode] = useState('')
  const [copiedResponse, setCopiedResponse] = useState(false)

  const [connectionState, setConnectionState] = useState<string>('disconnected')

  const [transferProgress, setTransferProgress] = useState(0)
  const [transferSpeed, setTransferSpeed] = useState('')
  const [transferTimeRemaining, setTransferTimeRemaining] = useState('')

  const [decryptedFiles, setDecryptedFiles] = useState<
    { id: string; name: string; size: number; blob: Blob }[]
  >([])
  const [receivingMetadata, setReceivingMetadata] = useState<{
    name: string
    size: number
    hash: string
  } | null>(null)

  const [senderHash, setSenderHash] = useState('')
  const [receiverHash, setReceiverHash] = useState('')
  const [hashMatch, setHashMatch] = useState<boolean | null>(null)

  const [initiatorQrUrl, setInitiatorQrUrl] = useState('')
  const [responseQrUrl, setResponseQrUrl] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [scannerError, setScannerError] = useState('')
  const [scanResult, setScanResult] = useState('')
  const [previewFile, setPreviewFile] = useState<{
    name: string
    blob: Blob
    textContent?: string
    type: string
  } | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)
  const senderCanvasRef = useRef<HTMLCanvasElement>(null)
  const receiverCanvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const qrScannerRef = useRef<QrScanner | null>(null)
  const offerQrInputRef = useRef<HTMLInputElement>(null)
  const answerQrInputRef = useRef<HTMLInputElement>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)

  const transferStartRef = useRef<number>(0)
  const receivedBytesRef = useRef<number>(0)
  const sentBytesRef = useRef<number>(0)
  const incomingChunksRef = useRef<ArrayBuffer[]>([])
  const speedHistory = useRef<number[]>([])
  const receivingMetadataRef = useRef<{ name: string; size: number; hash: string } | null>(null)
  const isCancelledRef = useRef<boolean>(false)

  const closePeerConnection = useCallback(() => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close()
      dataChannelRef.current = null
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
  }, [])

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash
      try {
        if (hash.startsWith('#offer=')) {
          const offerVal = decodeURIComponent(hash.substring(7))
          if (offerVal) {
            setRecipientRequest(offerVal)
            setActiveTab('receive')
            toast.success('Connection Request Code auto-imported!')
          }
        } else if (hash.startsWith('#answer=')) {
          const answerVal = decodeURIComponent(hash.substring(8))
          if (answerVal) {
            setRecipientResponse(answerVal)
            setActiveTab('send')
            toast.success('Handshake Response Code auto-imported!')
          }
        }
      } catch {
        toast.error('Invalid code in URL.')
      }
    }

    handleHashChange()
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    if (initiatorCode) {
      const fullUrl = `${window.location.origin}/tools/secure-share#offer=${initiatorCode}`
      QRCode.toDataURL(fullUrl, { width: 256, margin: 2 })
        .then(setInitiatorQrUrl)
        .catch(() => {})
    }
  }, [initiatorCode])

  useEffect(() => {
    if (responseCode) {
      const fullUrl = `${window.location.origin}/tools/secure-share#answer=${responseCode}`
      QRCode.toDataURL(fullUrl, { width: 256, margin: 2 })
        .then(setResponseQrUrl)
        .catch(() => {})
    }
  }, [responseCode])

  useEffect(() => {
    return () => {
      closePeerConnection()
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy()
        qrScannerRef.current = null
      }
    }
  }, [closePeerConnection])

  const drawGraph = useCallback((canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, rect.width, rect.height)

    const history = speedHistory.current
    if (history.length === 0) return

    const maxSpeed = Math.max(...history, 0.5)
    const padX = rect.width / (history.length - 1 || 1)

    ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)'
    ctx.lineWidth = 1
    for (let i = 1; i < 4; i++) {
      const y = (rect.height / 4) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(rect.width, y)
      ctx.stroke()
    }

    const grad = ctx.createLinearGradient(0, 0, 0, rect.height)
    grad.addColorStop(0, 'rgba(16, 185, 129, 0.25)')
    grad.addColorStop(1, 'rgba(16, 185, 129, 0.0)')

    ctx.beginPath()
    ctx.moveTo(0, rect.height)
    history.forEach((speed, idx) => {
      const x = idx * padX
      const y = rect.height - (speed / maxSpeed) * (rect.height - 12)
      ctx.lineTo(x, y)
    })
    ctx.lineTo(rect.width, rect.height)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    ctx.beginPath()
    history.forEach((speed, idx) => {
      const x = idx * padX
      const y = rect.height - (speed / maxSpeed) * (rect.height - 12)
      if (idx === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.strokeStyle = '#10b981'
    ctx.lineWidth = 2
    ctx.stroke()
  }, [])

  useEffect(() => {
    if (connectionState === 'connected' && transferProgress > 0) {
      if (activeTab === 'send') drawGraph(senderCanvasRef)
      else drawGraph(receiverCanvasRef)
    }
  }, [transferProgress, connectionState, activeTab, drawGraph])

  useEffect(() => {
    if (previewFile && ['image', 'video', 'audio', 'pdf'].includes(previewFile.type)) {
      const url = URL.createObjectURL(previewFile.blob)
      setPreviewUrl(url)
      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setPreviewUrl('')
    }
  }, [previewFile])

  const getPreviewType = (filename: string, blob: Blob) => {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    const mime = blob.type.toLowerCase()

    if (
      mime.startsWith('image/') ||
      ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico'].includes(ext)
    ) {
      return 'image'
    }
    if (mime.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov'].includes(ext)) {
      return 'video'
    }
    if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac'].includes(ext)) {
      return 'audio'
    }
    if (ext === 'pdf' || mime === 'application/pdf') {
      return 'pdf'
    }
    if (
      mime.startsWith('text/') ||
      [
        'txt',
        'js',
        'jsx',
        'ts',
        'tsx',
        'html',
        'css',
        'json',
        'md',
        'xml',
        'yml',
        'yaml',
        'ini',
        'conf',
        'sql',
        'csv',
        'sh',
        'py',
        'go',
        'rs',
        'java',
        'c',
        'cpp',
      ].includes(ext)
    ) {
      return 'text'
    }
    return 'unsupported'
  }

  const handlePreview = async (file: { name: string; blob: Blob }) => {
    const type = getPreviewType(file.name, file.blob)
    if (type === 'text') {
      try {
        const text = await file.blob.text()
        const truncatedText =
          text.length > 100000
            ? text.substring(0, 100000) + '\n\n...[Truncated - File too large to preview]...'
            : text
        setPreviewFile({ name: file.name, blob: file.blob, textContent: truncatedText, type })
      } catch {
        setPreviewFile({
          name: file.name,
          blob: file.blob,
          textContent: 'Failed to read text file content.',
          type,
        })
      }
    } else {
      setPreviewFile({ name: file.name, blob: file.blob, type })
    }
  }

  const handleQrScanSuccess = useCallback((rawValue: string) => {
    const parsed = parseQrPayload(rawValue)
    if (parsed) {
      if (parsed.type === 'offer') {
        setRecipientRequest(parsed.value)
        setActiveTab('receive')
        toast.success('SDP Offer Scanned & Loaded!')
      } else {
        setRecipientResponse(parsed.value)
        setActiveTab('send')
        toast.success('SDP Answer Scanned & Loaded!')
      }
      setShowScanner(false)
    } else {
      const display = rawValue.substring(0, 60)
      setScanResult(display)
      toast.info(`QR Code Scanned: ${display}`)
    }
  }, [])

  const handleQrImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'offer' | 'answer',
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true })
      if (result && result.data) {
        const rawValue = result.data
        const parsed = parseQrPayload(rawValue)
        if (type === 'offer') {
          setRecipientRequest(parsed?.type === 'offer' ? parsed.value : rawValue)
          toast.success('Connection Request Code read from QR image!')
        } else {
          setRecipientResponse(parsed?.type === 'answer' ? parsed.value : rawValue)
          toast.success('Handshake Response Code read from QR image!')
        }
      } else {
        toast.error('No QR code found in the uploaded image.')
      }
    } catch {
      toast.error('Failed to read QR code from image. Please ensure it is a clear QR code.')
    } finally {
      e.target.value = ''
    }
  }

  useEffect(() => {
    if (showScanner && videoRef.current) {
      setScannerError('')
      setScanResult('')

      const scanner = new QrScanner(
        videoRef.current,
        (result) => {
          handleQrScanSuccess(result.data)
        },
        {
          onDecodeError: () => {},
          highlightScanRegion: true,
          highlightCodeOutline: true,
          returnDetailedScanResult: true,
        },
      )

      qrScannerRef.current = scanner

      scanner.start().catch(() => {
        setScannerError(
          'Could not access camera device. Please grant permission or use the manual fallback.',
        )
      })
    } else {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy()
        qrScannerRef.current = null
      }
    }

    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy()
        qrScannerRef.current = null
      }
    }
  }, [showScanner, handleQrScanSuccess])

  const processFiles = (newFiles: File[]) => {
    const items: FileItem[] = newFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      path: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name,
      size: file.size,
    }))
    setFiles((prev) => [...prev, ...items])
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(Array.from(e.target.files))
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const clearAllFiles = () => {
    isCancelledRef.current = true
    setFiles([])
    setInitiatorCode('')
    setRecipientResponse('')
    setTransferProgress(0)
    setTransferSpeed('')
    setTransferTimeRemaining('')
    setSenderHash('')
    setReceiverHash('')
    setHashMatch(null)
    speedHistory.current = []
    closePeerConnection()
    setConnectionState('disconnected')
  }

  const setupSenderConnection = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one file or folder.')
      return
    }

    isCancelledRef.current = false
    setLoading(true)
    setLoadingProgress('Packaging files into archive...')
    try {
      const totalQueueBytes = files.reduce((acc, f) => acc + f.size, 0)
      if (totalQueueBytes > MAX_QUEUE_BYTES) {
        toast.error('Total file size exceeds the 4GB limit.')
        setLoading(false)
        setLoadingProgress('')
        return
      }

      const zip = new JSZip()
      files.forEach((item) => {
        zip.file(item.path, item.file)
      })
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const zipBuffer = await zipBlob.arrayBuffer()

      setLoadingProgress('Calculating SHA-256 hash...')
      const zipHash = await computeSha256(zipBuffer)
      setSenderHash(zipHash)

      setLoadingProgress('Initializing direct connection offer...')
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
      peerConnectionRef.current = pc

      const dc = pc.createDataChannel('file-transfer', { ordered: true })
      dataChannelRef.current = dc
      dc.binaryType = 'arraybuffer'
      dc.bufferedAmountLowThreshold = 524288

      pc.oniceconnectionstatechange = () => {
        setConnectionState(pc.iceConnectionState)
      }

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)

      setLoadingProgress('Gathering connection paths...')

      let codeSet = false
      const finalizeCode = async () => {
        if (codeSet) return
        codeSet = true
        if (pc.localDescription) {
          const comp = await compressSdp(pc.localDescription)
          setInitiatorCode(comp)
          setLoading(false)
          setLoadingProgress('')
          toast.success('Connection request code ready!')
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate === null) void finalizeCode()
      }

      setTimeout(() => {
        void finalizeCode()
      }, 5000)

      dc.onopen = () => {
        toast.success('Direct secure tunnel established!')
        void startFileTransfer(
          zipBuffer,
          files.length === 1 ? files[0].file.name + '.zip' : 'Archive.zip',
          dc,
          zipHash,
        )
      }

      dc.onclose = () => {
        setConnectionState('disconnected')
        toast.info('Connection closed by recipient.')
        resetSenderState()
      }
    } catch {
      toast.error('Initialization failed.')
      setLoading(false)
      setLoadingProgress('')
    }
  }

  const sendFilesDirectly = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one file or folder.')
      return
    }
    const dc = dataChannelRef.current
    if (!dc || dc.readyState !== 'open') {
      toast.error('Data channel is not open. Please reconnect.')
      return
    }

    setLoading(true)
    setLoadingProgress('Packaging new files...')
    try {
      const totalQueueBytes = files.reduce((acc, f) => acc + f.size, 0)
      if (totalQueueBytes > MAX_QUEUE_BYTES) {
        toast.error('Total file size exceeds the 4GB limit.')
        setLoading(false)
        setLoadingProgress('')
        return
      }

      const zip = new JSZip()
      files.forEach((item) => {
        zip.file(item.path, item.file)
      })
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const zipBuffer = await zipBlob.arrayBuffer()

      setLoadingProgress('Calculating SHA-256 hash...')
      const zipHash = await computeSha256(zipBuffer)
      setSenderHash(zipHash)

      setLoadingProgress('Sending files...')
      setLoading(false)
      setLoadingProgress('')

      void startFileTransfer(
        zipBuffer,
        files.length === 1 ? files[0].file.name + '.zip' : 'Archive.zip',
        dc,
        zipHash,
      )
    } catch {
      toast.error('Packaging failed.')
      setLoading(false)
      setLoadingProgress('')
    }
  }

  const connectToRecipient = async () => {
    const pc = peerConnectionRef.current
    if (!recipientResponse.trim() || !pc) return

    try {
      const answer = await decompressSdp(recipientResponse.trim())
      await pc.setRemoteDescription(answer)
      toast.success('Handshake response processed. Connecting...')
    } catch {
      toast.error(
        'Connection failed. If the other peer has reset, please click "Reset Connection Console" and start a new pairing handshake.',
      )
    }
  }

  const startFileTransfer = async (
    buffer: ArrayBuffer,
    filename: string,
    dc: RTCDataChannel,
    hashVal: string,
  ) => {
    const totalSize = buffer.byteLength
    try {
      dc.send(JSON.stringify({ type: 'meta', name: filename, size: totalSize, hash: hashVal }))
    } catch {
      toast.error('Failed to initiate transfer. Connection lost.')
      return
    }

    const CHUNK_SIZE = 65536
    let offset = 0
    sentBytesRef.current = 0
    transferStartRef.current = Date.now()
    speedHistory.current = []

    const sendNextChunk = () => {
      if (isCancelledRef.current) {
        try {
          dc.send(JSON.stringify({ type: 'cancel' }))
        } catch {}
        dc.close()
        return
      }

      while (offset < totalSize) {
        if (isCancelledRef.current) {
          try {
            dc.send(JSON.stringify({ type: 'cancel' }))
          } catch {}
          dc.close()
          return
        }

        if (dc.bufferedAmount > 1048576) {
          dc.onbufferedamountlow = () => {
            dc.onbufferedamountlow = null
            sendNextChunk()
          }
          return
        }

        const chunk = buffer.slice(offset, offset + CHUNK_SIZE)
        try {
          dc.send(chunk)
        } catch {
          return
        }
        offset += CHUNK_SIZE
        sentBytesRef.current = offset

        const progress = Math.min(100, (offset / totalSize) * 100)
        setTransferProgress(Math.floor(progress))

        const elapsed = (Date.now() - transferStartRef.current) / 1000
        if (elapsed > 0) {
          const speed = offset / elapsed
          setTransferSpeed(`${formatSize(speed)}/s`)

          const speedMB = speed / (1024 * 1024)
          speedHistory.current.push(speedMB)
          if (speedHistory.current.length > 25) {
            speedHistory.current.shift()
          }

          const remainingBytes = totalSize - offset
          const remainingTime = remainingBytes / speed
          setTransferTimeRemaining(
            remainingTime > 60
              ? `${Math.ceil(remainingTime / 60)}m`
              : `${Math.ceil(remainingTime)}s`,
          )
        }
      }

      if (!isCancelledRef.current) {
        try {
          dc.send(JSON.stringify({ type: 'done' }))
          toast.success('File transfer completed!')
          setFiles([])
        } catch {
          toast.error('Failed to finalize transfer.')
        }
      }
    }

    dc.onclose = () => {
      setConnectionState('disconnected')
      if (sentBytesRef.current < totalSize && !isCancelledRef.current) {
        toast.error('Connection dropped. Transfer interrupted.')
      } else {
        toast.info('Connection closed by recipient.')
      }
      resetSenderState()
    }

    sendNextChunk()
  }

  const resetRecipientState = useCallback(() => {
    setRecipientRequest('')
    setResponseCode('')
    setDecryptedFiles([])
    setReceivingMetadata(null)
    receivingMetadataRef.current = null
    setTransferProgress(0)
    setTransferSpeed('')
    setTransferTimeRemaining('')
    setReceiverHash('')
    setHashMatch(null)
    speedHistory.current = []
    closePeerConnection()
    setConnectionState('disconnected')
  }, [closePeerConnection])

  const handleProcessRequest = async () => {
    if (!recipientRequest.trim()) return

    setLoading(true)
    setLoadingProgress('Parsing connection request...')
    try {
      const offer = await decompressSdp(recipientRequest.trim())
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
      peerConnectionRef.current = pc

      pc.oniceconnectionstatechange = () => {
        setConnectionState(pc.iceConnectionState)
      }

      await pc.setRemoteDescription(offer)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)

      setLoadingProgress('Generating connection paths...')

      let codeSet = false
      const finalizeCode = async () => {
        if (codeSet) return
        codeSet = true
        if (pc.localDescription) {
          const comp = await compressSdp(pc.localDescription)
          setResponseCode(comp)
          setLoading(false)
          setLoadingProgress('')
          toast.success('Connection response code ready!')
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate === null) void finalizeCode()
      }

      setTimeout(() => {
        void finalizeCode()
      }, 5000)

      pc.ondatachannel = (event) => {
        const dc = event.channel
        dataChannelRef.current = dc
        dc.binaryType = 'arraybuffer'

        dc.onopen = () => {
          toast.success('Direct secure tunnel established!')
        }

        dc.onmessage = (msgEvent) => {
          try {
            if (typeof msgEvent.data === 'string') {
              const data = JSON.parse(msgEvent.data) as {
                type: string
                name?: string
                size?: number
                hash?: string
              }
              if (data.type === 'meta') {
                const metaVal = {
                  name: data.name || 'Archive.zip',
                  size: data.size || 0,
                  hash: data.hash || '',
                }
                receivingMetadataRef.current = metaVal
                setReceivingMetadata(metaVal)
                receivedBytesRef.current = 0
                incomingChunksRef.current = []
                transferStartRef.current = Date.now()
                speedHistory.current = []
              } else if (data.type === 'cancel') {
                toast.error('Transfer was cancelled by the sender.')
                resetRecipientState()
                return
              } else if (data.type === 'done') {
                void assembleAndExtractFiles()
              }
            } else {
              const chunk = msgEvent.data as ArrayBuffer
              const meta = receivingMetadataRef.current

              receivedBytesRef.current += chunk.byteLength

              if (receivedBytesRef.current > MAX_TRANSFER_BYTES) {
                toast.error('Transfer exceeds maximum allowed size (4GB). Aborting.')
                dc.close()
                resetRecipientState()
                return
              }

              if (meta && receivedBytesRef.current > meta.size * 1.05) {
                toast.error('Received data significantly exceeds declared size. Aborting.')
                dc.close()
                resetRecipientState()
                return
              }

              incomingChunksRef.current.push(chunk)

              if (meta) {
                const progress = Math.min(100, (receivedBytesRef.current / meta.size) * 100)
                setTransferProgress(Math.floor(progress))

                const elapsed = (Date.now() - transferStartRef.current) / 1000
                if (elapsed > 0) {
                  const speed = receivedBytesRef.current / elapsed
                  setTransferSpeed(`${formatSize(speed)}/s`)

                  const speedMB = speed / (1024 * 1024)
                  speedHistory.current.push(speedMB)
                  if (speedHistory.current.length > 25) {
                    speedHistory.current.shift()
                  }

                  const remainingBytes = meta.size - receivedBytesRef.current
                  const remainingTime = remainingBytes / speed
                  setTransferTimeRemaining(
                    remainingTime > 60
                      ? `${Math.ceil(remainingTime / 60)}m`
                      : `${Math.ceil(remainingTime)}s`,
                  )
                }
              }
            }
          } catch {
            toast.error('Data stream payload parse failed.')
          }
        }

        dc.onclose = () => {
          setConnectionState('disconnected')
          const meta = receivingMetadataRef.current
          if (meta && receivedBytesRef.current < meta.size) {
            toast.error(
              `Transfer interrupted! Only received ${formatSize(
                receivedBytesRef.current,
              )} of ${formatSize(meta.size)}. Please reset and retry.`,
            )
          } else {
            toast.info('Connection closed by sender.')
          }
          resetRecipientState()
        }
      }
    } catch {
      toast.error('Invalid Connection Request Code.')
      setLoading(false)
      setLoadingProgress('')
    }
  }

  const assembleAndExtractFiles = async () => {
    const meta = receivingMetadataRef.current
    if (!meta) return
    setLoading(true)
    setLoadingProgress('Reassembling file chunks...')
    try {
      const fullBlob = new Blob(incomingChunksRef.current, { type: 'application/zip' })
      const fullArrayBuffer = await fullBlob.arrayBuffer()

      setLoadingProgress('Verifying cryptographic SHA-256 checksum...')
      const calculatedHash = await computeSha256(fullArrayBuffer)
      setReceiverHash(calculatedHash)

      const checkMatch = calculatedHash === meta.hash
      setHashMatch(checkMatch)

      if (!checkMatch) {
        toast.error(
          'Integrity Checksum Mismatch! Files will not be extracted to protect your device.',
        )
        setLoading(false)
        setLoadingProgress('')
        incomingChunksRef.current = []
        return
      }

      toast.success('SHA-256 Checksum Verified! Payload is intact.')

      setLoadingProgress('Extracting package contents...')
      const zip = await JSZip.loadAsync(fullArrayBuffer)
      const tempFiles: { id: string; name: string; size: number; blob: Blob }[] = []

      const entries = Object.keys(zip.files)
      for (const filename of entries) {
        const fileEntry = zip.files[filename]
        if (!fileEntry.dir) {
          let fileBlob = await fileEntry.async('blob')
          const sanitizedName = sanitizePath(filename)
          if (!sanitizedName) continue

          const mimeType = getMimeType(sanitizedName)
          if (mimeType) {
            fileBlob = new Blob([fileBlob], { type: mimeType })
          }

          tempFiles.push({
            id: crypto.randomUUID(),
            name: sanitizedName,
            size: fileBlob.size,
            blob: fileBlob,
          })
        }
      }

      setDecryptedFiles(tempFiles)
      toast.success('All files successfully transferred and extracted!')
    } catch {
      toast.error('Failed to unpack files.')
    } finally {
      setLoading(false)
      setLoadingProgress('')
      incomingChunksRef.current = []
    }
  }

  const downloadAllAsZip = async () => {
    try {
      const zip = new JSZip()
      decryptedFiles.forEach((item) => {
        zip.file(item.name, item.blob)
      })
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      triggerDownload(url, receivingMetadata?.name || 'Archive.zip')
    } catch {
      toast.error('Failed to bundle downloads.')
    }
  }

  const downloadSingleFile = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob)
    triggerDownload(url, name.split('/').pop() || name)
  }

  const resetSenderState = () => {
    isCancelledRef.current = true
    setInitiatorCode('')
    setRecipientResponse('')
    setTransferProgress(0)
    setTransferSpeed('')
    setTransferTimeRemaining('')
    setSenderHash('')
    setReceiverHash('')
    setHashMatch(null)
    speedHistory.current = []
    closePeerConnection()
    setConnectionState('disconnected')
  }

  return (
    <ToolLayout
      title="Secure Share"
      description="100% Serverless, direct browser-to-browser P2P file & folder sharing"
      icon={ShieldCheck}
    >
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v as 'send' | 'receive')
        }}
      >
        <TabsList className="bg-secondary grid w-full grid-cols-2">
          <TabsTrigger
            value="send"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 text-xs sm:text-sm"
          >
            <Lock className="h-4 w-4" />
            Send Files (P2P)
          </TabsTrigger>
          <TabsTrigger
            value="receive"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2 text-xs sm:text-sm"
          >
            <Unlock className="h-4 w-4" />
            Receive Files (P2P)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="mt-4 flex flex-col gap-6">
          <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
            <div
              className={`border-primary/20 hover:border-primary/40 hover:bg-secondary/25 bg-secondary/10 group relative flex cursor-pointer flex-col items-center justify-center gap-4 overflow-hidden rounded-xl border border-dashed px-4 py-9 text-center shadow-xs transition-all duration-300 ${
                isDragOver ? 'border-primary/60 bg-primary/5 scale-[1.01]' : ''
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDragEnter={handleDragOver}
            >
              <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110">
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="text-foreground text-sm font-semibold">
                  Drag and drop files & folders here
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Pack directory structures or multiple files directly
                </p>
              </div>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    fileInputRef.current?.click()
                  }}
                  className="text-muted-foreground dark:hover:text-foreground text-xs hover:text-white"
                >
                  <FileIcon className="mr-1.5 h-3.5 w-3.5" />
                  Select Files
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    folderInputRef.current?.click()
                  }}
                  className="text-muted-foreground dark:hover:text-foreground text-xs hover:text-white"
                >
                  <FolderIcon className="mr-1.5 h-3.5 w-3.5" />
                  Select Folders
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={folderInputRef}
                type="file"
                multiple
                {...{ webkitdirectory: '', directory: '' }}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {files.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-foreground text-xs font-semibold">
                    Queue: {files.length} {files.length === 1 ? 'file' : 'files'} (
                    {formatSize(files.reduce((acc, f) => acc + f.size, 0))})
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFiles}
                    className="text-destructive hover:!bg-destructive/10 hover:!text-destructive h-7 px-2 text-xs"
                  >
                    Clear All
                  </Button>
                </div>
                <div className="flex max-h-48 flex-col gap-2.5 overflow-y-auto pr-1">
                  {files.map((item) => (
                    <div
                      key={item.id}
                      className="group border-primary/10 from-secondary/20 to-secondary/40 hover:from-secondary/30 hover:to-secondary/60 hover:border-primary/35 relative flex items-center justify-between overflow-hidden rounded-xl border bg-gradient-to-r p-3 text-xs shadow-xs transition-all duration-300 hover:shadow-md"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {item.path.includes('/') ? (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
                            <FolderIcon className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg p-2">
                            <FileIcon className="h-4 w-4" />
                          </div>
                        )}
                        <div className="flex min-w-0 flex-col">
                          <span className="text-foreground max-w-[200px] truncate font-mono font-medium sm:max-w-md">
                            {item.path}
                          </span>
                          <span className="text-muted-foreground mt-0.5 font-mono text-[10px]">
                            {formatSize(item.size)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-2 flex shrink-0 items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => void handlePreview({ name: item.path, blob: item.file })}
                          className="text-muted-foreground hover:!text-primary hover:!bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <button
                          onClick={() => removeFile(item.id)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
            {connectionState === 'connected' ? (
              <Button
                onClick={() => {
                  void sendFilesDirectly()
                }}
                disabled={loading || files.length === 0}
                className="to-primary text-primary-foreground h-11 w-full gap-2 bg-gradient-to-r from-emerald-500 font-semibold shadow-md transition-all duration-300 hover:opacity-95 hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {loadingProgress}
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Send Queued Files (P2P)
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  void setupSenderConnection()
                }}
                disabled={loading || files.length === 0 || !!initiatorCode}
                className="to-primary text-primary-foreground h-11 w-full gap-2 bg-gradient-to-r from-emerald-500 font-semibold shadow-md transition-all duration-300 hover:opacity-95 hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {loadingProgress}
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Initialize Secure Handshake
                  </>
                )}
              </Button>
            )}
          </div>

          {initiatorCode && (
            <div className="flex flex-col gap-6">
              <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
                <div className="flex flex-col items-center gap-5 sm:flex-row">
                  {initiatorQrUrl && (
                    <div className="flex h-40 w-40 flex-shrink-0 items-center justify-center rounded-lg border bg-white p-3">
                      <img
                        src={initiatorQrUrl}
                        alt="Connection QR"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                  <div className="w-full min-w-0 flex-1">
                    <h4 className="text-foreground flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
                      <QrCode className="text-primary h-4 w-4" />
                      Step 1: Share Connection QR / Request Code
                    </h4>
                    <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                      Let the recipient scan this QR code with their webcam scanner, or copy and
                      send the compressed handshake code below.
                    </p>
                    <div className="border-border bg-secondary/50 mt-3 flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2.5">
                      <span className="text-foreground min-w-0 flex-1 truncate font-mono text-xs">
                        {initiatorCode}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-border bg-secondary/50 text-muted-foreground flex h-9 w-9 items-center justify-center p-0 hover:text-white"
                        onClick={() => {
                          void navigator.clipboard.writeText(initiatorCode)
                          setCopiedInitiator(true)
                          setTimeout(() => setCopiedInitiator(false), 2000)
                          toast.success('Connection code copied!')
                        }}
                      >
                        {copiedInitiator ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-border bg-card flex flex-col gap-3 rounded-xl border p-5 shadow-sm">
                <div>
                  <h4 className="text-foreground text-xs font-bold tracking-wider uppercase">
                    Step 2: Paste Recipient Handshake Response
                  </h4>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Paste the response token provided by the recipient to open the direct secure
                    tunnel.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={recipientResponse}
                    onChange={(e) => setRecipientResponse(e.target.value)}
                    placeholder="Paste recipient's Handshake Response here..."
                    className="bg-secondary border-border text-foreground !h-10 w-full font-mono text-xs sm:flex-1"
                  />
                  <input
                    type="file"
                    ref={answerQrInputRef}
                    accept="image/*"
                    onChange={(e) => void handleQrImageUpload(e, 'answer')}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => answerQrInputRef.current?.click()}
                    className="border-border bg-secondary/50 text-muted-foreground h-10 shrink-0 gap-1.5 px-3 text-xs hover:text-white"
                  >
                    <Upload className="h-4 w-4" />
                    Upload QR Image
                  </Button>
                  <Button
                    onClick={() => {
                      void connectToRecipient()
                    }}
                    disabled={!recipientResponse.trim()}
                    className="to-primary text-primary-foreground h-10 w-full shrink-0 justify-center bg-gradient-to-r from-emerald-500 px-4 text-xs font-semibold shadow-sm transition-all duration-300 hover:opacity-95 sm:w-auto"
                  >
                    <Link2 className="mr-1.5 h-4 w-4" />
                    Connect P2P
                  </Button>
                </div>
                <div className="mt-1 text-center">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      setShowScanner((prev) => !prev)
                    }}
                    className="text-primary gap-1 text-xs"
                  >
                    <Scan className="h-3.5 w-3.5" />
                    {showScanner ? 'Close Webcam Scanner' : 'Open Webcam to Scan Recipient QR'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {showScanner && (
            <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5 text-center shadow-sm">
              <h4 className="text-foreground text-xs font-bold tracking-wider uppercase">
                Live Webcam Scan
              </h4>
              {scannerError ? (
                <p className="text-destructive text-xs">{scannerError}</p>
              ) : (
                <div className="border-primary/30 relative mx-auto w-full max-w-sm overflow-hidden rounded-lg border bg-black">
                  <video ref={videoRef} className="h-auto w-full bg-black" />
                  <div className="border-primary/40 pointer-events-none absolute inset-0 flex items-center justify-center border-2">
                    <div className="border-primary h-48 w-48 animate-pulse border-2 border-dashed" />
                  </div>
                </div>
              )}
              {scanResult && (
                <p className="font-mono text-xs text-green-500">
                  Scanned: {scanResult.substring(0, 30)}...
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowScanner(false)}
                className="text-muted-foreground dark:hover:text-foreground mx-auto mt-2 w-fit text-xs hover:text-white"
              >
                Close Camera
              </Button>
            </div>
          )}

          {connectionState !== 'disconnected' && (
            <div className="border-primary/20 bg-primary/5 flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-foreground flex items-center gap-2 text-xs font-semibold">
                  <Activity className="text-primary h-4 w-4 animate-pulse" />
                  Connection Console
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase ${
                    connectionState === 'connected'
                      ? 'bg-green-500/20 text-green-500'
                      : connectionState === 'completed'
                        ? 'bg-blue-500/20 text-blue-500'
                        : 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-500'
                  }`}
                >
                  {connectionState}
                </span>
              </div>

              {connectionState === 'connected' && transferProgress > 0 && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Streaming data directly...</span>
                    <span className="text-foreground font-mono font-bold">{transferProgress}%</span>
                  </div>
                  <div className="bg-secondary/50 h-2 w-full overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${transferProgress}%` }}
                    />
                  </div>
                  <div className="border-border/50 text-muted-foreground grid grid-cols-2 gap-4 border-t pt-2 font-mono text-[11px]">
                    <div>
                      Speed: <span className="text-foreground font-semibold">{transferSpeed}</span>
                    </div>
                    <div className="text-right">
                      Time Remaining:{' '}
                      <span className="text-foreground font-semibold">{transferTimeRemaining}</span>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-col gap-1.5">
                    <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                      Real-Time Throughput (MB/s)
                    </span>
                    <canvas
                      ref={senderCanvasRef}
                      className="bg-secondary/15 border-border/50 h-24 w-full rounded-lg border"
                    />
                  </div>

                  {senderHash && (
                    <div className="border-border/50 bg-secondary/10 text-muted-foreground flex flex-col gap-1 rounded border px-3 py-2.5 font-mono text-[10px]">
                      <span className="text-foreground text-[9px] font-semibold tracking-wider uppercase">
                        Sender Integrity SHA-256 Checksum
                      </span>
                      <span className="text-foreground/80 truncate">{senderHash}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {initiatorCode && (
            <Button
              variant="outline"
              onClick={resetSenderState}
              className="border-primary/30 text-primary hover:!bg-primary hover:!text-primary-foreground animate-fade-in mt-4 h-9 w-full rounded-xl text-xs font-semibold shadow-xs transition-all duration-300"
            >
              Reset Connection Console
            </Button>
          )}
        </TabsContent>

        <TabsContent value="receive" className="mt-4 flex flex-col gap-6">
          <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
            <div>
              <h4 className="text-foreground text-xs font-bold tracking-wider uppercase">
                Step 1: Paste Connection Request Code
              </h4>
              <p className="text-muted-foreground mt-1 text-xs">
                Paste the handshake request code generated by the sender.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  value={recipientRequest}
                  onChange={(e) => setRecipientRequest(e.target.value)}
                  placeholder="Paste initiator's Connection Request Code here..."
                  disabled={loading || !!responseCode}
                  className="bg-secondary border-border text-foreground !h-10 w-full font-mono text-xs sm:flex-1"
                />
                <input
                  type="file"
                  ref={offerQrInputRef}
                  accept="image/*"
                  onChange={(e) => void handleQrImageUpload(e, 'offer')}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => offerQrInputRef.current?.click()}
                  disabled={loading || !!responseCode}
                  className="border-border bg-secondary/50 text-muted-foreground h-10 shrink-0 gap-1.5 px-3 text-xs hover:text-white"
                >
                  <Upload className="h-4 w-4" />
                  Upload QR Image
                </Button>
              </div>
              {!responseCode && (
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() => {
                      void handleProcessRequest()
                    }}
                    disabled={loading || !recipientRequest.trim()}
                    className="to-primary text-primary-foreground h-10 w-full gap-2 bg-gradient-to-r from-emerald-500 text-xs font-semibold shadow-md transition-all duration-300 hover:opacity-95"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        {loadingProgress}
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-3.5 w-3.5" />
                        Accept Handshake Request
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowScanner((prev) => !prev)
                    }}
                    className="text-muted-foreground dark:hover:text-foreground mx-auto mt-1 w-fit gap-1 text-xs hover:text-white"
                  >
                    <Scan className="h-3.5 w-3.5" />
                    {showScanner ? 'Close Scanner' : 'Scan Sender QR via Webcam'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {showScanner && !responseCode && (
            <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5 text-center shadow-sm">
              <h4 className="text-foreground text-xs font-bold tracking-wider uppercase">
                Scan Sender Connection Offer
              </h4>
              {scannerError ? (
                <p className="text-destructive text-xs">{scannerError}</p>
              ) : (
                <div className="border-primary/30 relative mx-auto w-full max-w-sm overflow-hidden rounded-lg border bg-black">
                  <video ref={videoRef} className="h-auto w-full bg-black" />
                  <div className="border-primary/40 pointer-events-none absolute inset-0 flex items-center justify-center border-2">
                    <div className="border-primary h-48 w-48 animate-pulse border-2 border-dashed" />
                  </div>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowScanner(false)}
                className="text-muted-foreground dark:hover:text-foreground mx-auto mt-2 w-fit text-xs hover:text-white"
              >
                Close Camera
              </Button>
            </div>
          )}

          {responseCode && (
            <div className="flex flex-col gap-6">
              <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
                <div className="flex flex-col items-center gap-5 sm:flex-row">
                  {responseQrUrl && (
                    <div className="flex h-40 w-40 flex-shrink-0 items-center justify-center rounded-lg border bg-white p-3">
                      <img
                        src={responseQrUrl}
                        alt="Response QR"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                  <div className="w-full min-w-0 flex-1">
                    <h4 className="text-foreground flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase">
                      <QrCode className="text-primary h-4 w-4" />
                      Step 2: Share Response QR / Handshake Code
                    </h4>
                    <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                      Let the sender scan this QR code with their camera, or copy and send the
                      response handshake code below back to the initiator.
                    </p>
                    <div className="border-border bg-secondary/50 mt-3 flex min-w-0 items-center gap-2 rounded-lg border px-3 py-2.5">
                      <span className="text-foreground min-w-0 flex-1 truncate font-mono text-xs">
                        {responseCode}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-border bg-secondary/50 text-muted-foreground flex h-9 w-9 items-center justify-center p-0 hover:text-white"
                        onClick={() => {
                          void navigator.clipboard.writeText(responseCode)
                          setCopiedResponse(true)
                          setTimeout(() => setCopiedResponse(false), 2000)
                          toast.success('Response code copied!')
                        }}
                      >
                        {copiedResponse ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {connectionState !== 'disconnected' && (
            <div className="border-primary/20 bg-primary/5 flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-foreground flex items-center gap-2 text-xs font-semibold">
                  <Activity className="text-primary h-4 w-4 animate-pulse" />
                  Connection Console
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase ${
                    connectionState === 'connected'
                      ? 'bg-green-500/20 text-green-500'
                      : connectionState === 'completed'
                        ? 'bg-blue-500/20 text-blue-500'
                        : 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-500'
                  }`}
                >
                  {connectionState}
                </span>
              </div>

              {connectionState === 'connected' &&
                receivingMetadata &&
                decryptedFiles.length === 0 && (
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="text-foreground truncate font-semibold">
                        {receivingMetadata.name}
                      </span>
                      <span className="text-muted-foreground font-mono text-[10px]">
                        Size: {formatSize(receivingMetadata.size)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Streaming directly to RAM...</span>
                      <span className="text-foreground font-mono font-bold">
                        {transferProgress}%
                      </span>
                    </div>
                    <div className="bg-secondary/50 h-2 w-full overflow-hidden rounded-full">
                      <div
                        className="bg-primary h-full transition-all duration-300"
                        style={{ width: `${transferProgress}%` }}
                      />
                    </div>
                    <div className="border-border/50 text-muted-foreground mt-1 grid grid-cols-2 gap-4 border-t pt-2 font-mono text-[11px]">
                      <div>
                        Speed:{' '}
                        <span className="text-foreground font-semibold">{transferSpeed}</span>
                      </div>
                      <div className="text-right">
                        Time Remaining:{' '}
                        <span className="text-foreground font-semibold">
                          {transferTimeRemaining}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-col gap-1.5">
                      <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                        Real-Time Throughput (MB/s)
                      </span>
                      <canvas
                        ref={receiverCanvasRef}
                        className="bg-secondary/15 border-border/50 h-24 w-full rounded-lg border"
                      />
                    </div>
                  </div>
                )}

              {decryptedFiles.length > 0 && (
                <div className="border-border/30 flex flex-col gap-4 border-t pt-3">
                  {hashMatch !== null && (
                    <div
                      className={`relative flex items-start gap-3 overflow-hidden rounded-xl border p-4 text-xs leading-relaxed shadow-xs backdrop-blur-xs before:absolute before:top-0 before:bottom-0 before:left-0 before:w-1 ${
                        hashMatch
                          ? 'border-green-500/20 bg-green-500/5 text-green-600 before:bg-green-500 dark:text-green-500'
                          : 'border-red-500/20 bg-red-500/5 text-red-600 before:bg-red-500 dark:text-red-500'
                      }`}
                    >
                      {hashMatch ? (
                        <>
                          <Check className="mt-0.5 h-4 w-4 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-bold">Cryptographic Integrity Verified</span>
                            <p className="text-foreground/80 mt-1 truncate font-mono text-[10px]">
                              SHA-256: {receiverHash}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="font-bold">Warning: Integrity Checksum Mismatch</span>
                            <p className="mt-1 leading-relaxed">
                              The reassembled zip archive hash does not match the sender's computed
                              SHA-256. Payload may be corrupt. Please click "Reset Connection
                              Console" to retry the transfer.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <span className="text-foreground text-xs font-semibold">
                      Received Files ({decryptedFiles.length}):
                    </span>
                    <Button
                      onClick={() => {
                        void downloadAllAsZip()
                      }}
                      size="sm"
                      className="to-primary text-primary-foreground h-8 w-full justify-center gap-1.5 bg-gradient-to-r from-emerald-500 px-3 text-xs shadow-sm transition-all duration-300 hover:opacity-95 sm:w-auto"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download ZIP Archive
                    </Button>
                  </div>

                  <div className="flex max-h-60 flex-col gap-2.5 overflow-y-auto">
                    {decryptedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="group border-primary/10 from-secondary/20 to-secondary/40 hover:from-secondary/30 hover:to-secondary/60 hover:border-primary/35 relative flex items-center justify-between overflow-hidden rounded-xl border bg-gradient-to-r p-3 text-xs shadow-xs transition-all duration-300 hover:shadow-md"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          {file.name.includes('/') ? (
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
                              <FolderIcon className="h-4 w-4" />
                            </div>
                          ) : (
                            <div className="bg-primary/10 text-primary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg p-2">
                              <FileIcon className="h-4 w-4" />
                            </div>
                          )}
                          <div className="flex min-w-0 flex-col">
                            <span className="text-foreground max-w-[200px] truncate font-mono font-medium sm:max-w-md">
                              {file.name}
                            </span>
                            <span className="text-muted-foreground mt-0.5 font-mono text-[10px]">
                              Size: {formatSize(file.size)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-2 flex shrink-0 items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => void handlePreview(file)}
                            className="text-muted-foreground hover:!text-primary hover:!bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => downloadSingleFile(file.blob, file.name)}
                            className="text-muted-foreground hover:!text-primary hover:!bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {(responseCode || decryptedFiles.length > 0) && (
            <Button
              variant="outline"
              onClick={resetRecipientState}
              className="border-primary/30 text-primary hover:!bg-primary hover:!text-primary-foreground animate-fade-in mt-4 h-9 w-full rounded-xl text-xs font-semibold shadow-xs transition-all duration-300"
            >
              Reset Connection Console
            </Button>
          )}
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-xs leading-relaxed text-yellow-600 dark:text-yellow-500">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="text-[10px] font-semibold tracking-wider uppercase">
            Zero-Server P2P Direct Tunnel Policy
          </p>
          <p className="mt-1">
            Data channel streams directly browser-to-browser using standard RTCPeerConnection over
            local NAT paths. No databases, logs, or intermediate third-party hosting servers can
            intercept or store your data. Ideal for highly-confidential source code and developer
            keys.
          </p>
        </div>
      </div>

      {previewFile && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md duration-200">
          <div className="bg-card border-border animate-in zoom-in-95 flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border shadow-2xl duration-200">
            <div className="border-border flex items-center justify-between border-b px-6 py-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-foreground truncate font-mono text-sm font-semibold">
                  {previewFile.name}
                </h3>
                <p className="text-muted-foreground mt-0.5 font-mono text-xs">
                  {formatSize(previewFile.blob.size)} • {previewFile.type.toUpperCase()} Preview
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadSingleFile(previewFile.blob, previewFile.name)}
                  className="h-8 gap-1.5 px-3 text-xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPreviewFile(null)}
                  className="text-muted-foreground hover:text-foreground h-8 w-8 rounded-lg p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="bg-secondary/10 flex min-h-[300px] flex-1 items-center justify-center overflow-auto p-6">
              {previewFile.type === 'image' && previewUrl && (
                <div className="relative flex max-h-[60vh] w-full items-center justify-center overflow-hidden">
                  <img
                    src={previewUrl}
                    alt={previewFile.name}
                    className="max-h-[55vh] max-w-full rounded-lg object-contain shadow-md"
                  />
                </div>
              )}

              {previewFile.type === 'video' && previewUrl && (
                <div className="w-full max-w-2xl overflow-hidden rounded-lg bg-black shadow-md">
                  <video src={previewUrl} controls className="max-h-[55vh] w-full" />
                </div>
              )}

              {previewFile.type === 'audio' && previewUrl && (
                <div className="bg-card flex w-full max-w-md flex-col gap-3 rounded-xl border p-4 shadow-xs">
                  <p className="text-muted-foreground truncate text-center font-mono text-xs">
                    {previewFile.name}
                  </p>
                  <audio src={previewUrl} controls className="mt-2 w-full" />
                </div>
              )}

              {previewFile.type === 'pdf' && previewUrl && (
                <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500">
                    <FileIcon className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="text-foreground text-sm font-semibold">PDF Document Ready</h4>
                    <p className="text-muted-foreground mt-1 max-w-xs text-xs leading-relaxed">
                      For the best experience, please open this PDF document in a new tab to view it
                      with your browser's native reader.
                    </p>
                  </div>
                  <Button
                    onClick={() => window.open(previewUrl, '_blank')}
                    className="to-primary text-primary-foreground mt-2 h-9 bg-gradient-to-r from-emerald-500 font-semibold shadow-md transition-all hover:opacity-95"
                  >
                    Open PDF in New Tab
                  </Button>
                </div>
              )}

              {previewFile.type === 'text' && (
                <div className="bg-secondary/20 text-foreground max-h-[55vh] w-full overflow-auto rounded-lg border p-4 text-left font-mono text-xs leading-relaxed whitespace-pre-wrap select-text">
                  {previewFile.textContent}
                </div>
              )}

              {previewFile.type === 'unsupported' && (
                <div className="flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <div className="bg-secondary/40 text-muted-foreground flex h-14 w-14 items-center justify-center rounded-2xl border">
                    <FileIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-foreground text-sm font-semibold">Preview not available</h4>
                    <p className="text-muted-foreground mt-1 max-w-xs text-xs leading-relaxed">
                      This file format is not supported for inline browser preview. Please download
                      the file to open it on your device.
                    </p>
                  </div>
                  <Button
                    onClick={() => downloadSingleFile(previewFile.blob, previewFile.name)}
                    className="to-primary text-primary-foreground mt-2 h-9 bg-gradient-to-r from-emerald-500 font-semibold shadow-md transition-all hover:opacity-95"
                  >
                    <Download className="mr-1.5 h-4 w-4" />
                    Download File
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
