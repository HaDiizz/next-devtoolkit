'use client'

import { useState, useRef, useCallback } from 'react'
import { Binary, Upload, ImageIcon, X, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ToolLayout, OutputArea } from '@/components/tool-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useCopyToClipboard } from '@/hooks/use-copy'
import Image from 'next/image'

export default function Base64ConverterTool() {
  const [encodeInput, setEncodeInput] = useState('')
  const [encodeOutput, setEncodeOutput] = useState('')
  const [decodeInput, setDecodeInput] = useState('')
  const [decodeOutput, setDecodeOutput] = useState('')
  const [error, setError] = useState('')

  // Image to Base64
  const [imageBase64, setImageBase64] = useState('')
  const [imagePreview, setImagePreview] = useState('')
  const [imageName, setImageName] = useState('')
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Base64 to Image preview
  const [decodeImagePreview, setDecodeImagePreview] = useState('')
  const [isDecodeImage, setIsDecodeImage] = useState(false)

  const copy = useCopyToClipboard()

  const encode = () => {
    try {
      setEncodeOutput(btoa(unescape(encodeURIComponent(encodeInput))))
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const decode = () => {
    setIsDecodeImage(false)
    setDecodeImagePreview('')
    try {
      const decoded = atob(decodeInput.replace(/^data:[^;]+;base64,/, ''))
      setDecodeOutput(decodeURIComponent(escape(decoded)))
      setError('')
    } catch {
      // Could be binary / image data
      tryDecodeAsImage()
    }
  }

  const tryDecodeAsImage = () => {
    const raw = decodeInput.trim()
    // If it has a data URI prefix
    if (raw.startsWith('data:image')) {
      setDecodeImagePreview(raw)
      setIsDecodeImage(true)
      setDecodeOutput('[Image data detected - see preview below]')
      setError('')
      return
    }
    // Try wrapping raw base64 as image
    const testUrl = `data:image/png;base64,${raw}`
    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setDecodeImagePreview(testUrl)
      setIsDecodeImage(true)
      setDecodeOutput('[Image data detected - see preview below]')
      setError('')
    }
    img.onerror = () => {
      setError('Invalid Base64 string. Cannot decode as text or image.')
      setDecodeOutput('')
    }
    img.src = testUrl
  }

  const handleImageUpload = useCallback((file: File) => {
    setError('')
    setImageName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setImagePreview(result)
      setImageBase64(result)
    }
    reader.onerror = () => setError('Failed to read image file.')
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file && file.type.startsWith('image')) {
        handleImageUpload(file)
      }
    },
    [handleImageUpload],
  )

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleImageUpload(file)
  }

  const clearImage = () => {
    setImageBase64('')
    setImagePreview('')
    setImageName('')
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const downloadImage = () => {
    if (!decodeImagePreview) return
    const a = document.createElement('a')
    a.href = decodeImagePreview
    a.download = 'decoded-image.png'
    a.click()
  }

  return (
    <ToolLayout
      title="Base64 Encoder/Decoder"
      description="Encode and decode Base64 strings and images with live preview"
      icon={Binary}
    >
      <Tabs defaultValue="encode-text">
        <TabsList className="bg-secondary">
          <TabsTrigger
            value="encode-text"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Encode Text
          </TabsTrigger>
          <TabsTrigger
            value="decode-text"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Decode
          </TabsTrigger>
          <TabsTrigger
            value="image-to-base64"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Image to Base64
          </TabsTrigger>
        </TabsList>

        {/* Encode Text */}
        <TabsContent value="encode-text" className="mt-4">
          <div className="flex flex-col gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Plain Text</Label>
              <textarea
                value={encodeInput}
                onChange={(e) => setEncodeInput(e.target.value)}
                rows={5}
                placeholder="Enter text to encode..."
                className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-ring mt-1 w-full resize-none rounded-lg border px-4 py-3 text-sm focus:ring-1 focus:outline-none"
              />
            </div>
            <Button
              onClick={encode}
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-fit"
            >
              Encode to Base64
            </Button>
            {encodeOutput && <OutputArea label="Base64 Output" value={encodeOutput} rows={5} />}
          </div>
        </TabsContent>

        {/* Decode (text or image auto-detection) */}
        <TabsContent value="decode-text" className="mt-4">
          <div className="flex flex-col gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">
                Base64 String (text or image data URI)
              </Label>
              <textarea
                value={decodeInput}
                onChange={(e) => setDecodeInput(e.target.value)}
                rows={5}
                placeholder="Paste Base64 string or data:image/... URI to decode..."
                className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-ring mt-1 w-full resize-none rounded-lg border px-4 py-3 font-mono text-sm focus:ring-1 focus:outline-none"
              />
            </div>
            <Button
              onClick={decode}
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-fit"
            >
              Decode Base64
            </Button>

            {decodeOutput && !isDecodeImage && (
              <OutputArea label="Decoded Text" value={decodeOutput} rows={5} />
            )}

            {isDecodeImage && decodeImagePreview && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground text-xs font-medium">Decoded Image Preview</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground h-7 gap-1.5 text-xs"
                    onClick={downloadImage}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                </div>
                <div className="border-border bg-secondary/30 flex items-center justify-center rounded-lg border p-6">
                  <div className="relative h-80 w-full max-w-lg">
                    <Image
                      src={decodeImagePreview}
                      alt="Decoded base64 image"
                      fill
                      className="rounded object-contain"
                      priority
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Image to Base64 */}
        <TabsContent value="image-to-base64" className="mt-4">
          <div className="flex flex-col gap-4">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*,.svg"
              onChange={handleFileSelect}
              className="hidden"
            />
            {!imagePreview ? (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
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
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <ImageIcon className="text-primary h-5 w-5" />
                    <div>
                      <p className="text-foreground text-sm font-medium">{imageName}</p>
                      <p className="text-muted-foreground text-xs">
                        {(imageBase64.length / 1024).toFixed(1)} KB encoded
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground h-8 w-8"
                    onClick={clearImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="border-border bg-secondary/30 flex items-center justify-center rounded-lg border p-4">
                  <div className="relative h-60 w-full max-w-lg">
                    <Image
                      src={imagePreview}
                      alt="Uploaded preview"
                      fill
                      className="rounded object-contain"
                      priority
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-muted-foreground text-xs font-medium">Base64 Data URI</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground h-7 gap-1.5 text-xs"
                      onClick={() => {
                        void copy(imageBase64)
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                  <textarea
                    readOnly
                    value={imageBase64}
                    rows={6}
                    className="border-border bg-secondary/50 text-foreground w-full resize-none rounded-lg border px-4 py-3 font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {error && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-sm">
          {error}
        </div>
      )}
    </ToolLayout>
  )
}
