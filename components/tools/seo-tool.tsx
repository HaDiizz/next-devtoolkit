'use client'

import { useState, useRef, useCallback } from 'react'
import {
  SearchCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Copy,
  Check,
  Image as ImageIcon,
  FileJson,
  Loader2,
} from 'lucide-react'
import JSZip from 'jszip'
import { ToolLayout } from '@/components/tool-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCopyToClipboard } from '@/hooks/use-copy'

type Tab = 'preview' | 'manifest' | 'assets'
type PreviewMode = 'google' | 'facebook' | 'twitter'

interface MetaInputs {
  siteName: string
  title: string
  description: string
  url: string
  ogImage: string
  faviconUrl: string
  twitterHandle: string
  keywords: string
  themeColor: string
  backgroundColor: string
  lang: string
}

interface ManifestInputs {
  name: string
  shortName: string
  description: string
  startUrl: string
  display: string
  backgroundColor: string
  themeColor: string
  lang: string
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url || 'example.com'
  }
}

interface CheckRow {
  label: string
  passed: boolean
  warn?: boolean
  info: string
}

function buildChecks(m: MetaInputs): CheckRow[] {
  const titleLen = m.title.length
  const descLen = m.description.length
  const domain = getDomain(m.url)
  const truncate = (str: string, n = 40) => (str.length > n ? `${str.slice(0, n)}…` : str)

  return [
    {
      label: 'Title (10–60 chars)',
      passed: titleLen >= 10 && titleLen <= 60,
      warn: titleLen > 0 && (titleLen < 10 || titleLen > 60),
      info: titleLen > 0 ? `${titleLen} chars` : 'Missing',
    },
    {
      label: 'Meta description (50–160 chars)',
      passed: descLen >= 50 && descLen <= 160,
      warn: descLen > 0 && (descLen < 50 || descLen > 160),
      info: descLen > 0 ? `${descLen} chars` : 'Missing',
    },
    {
      label: 'Canonical URL (HTTPS)',
      passed: m.url.startsWith('https://'),
      warn: m.url.startsWith('http://'),
      info: m.url
        ? m.url.startsWith('https://')
          ? truncate(domain ?? m.url)
          : `Not HTTPS — ${truncate(domain ?? m.url)}`
        : 'Missing',
    },
    {
      label: 'Favicon provided',
      passed: m.faviconUrl.startsWith('http') || m.url.startsWith('http'),
      info: m.faviconUrl
        ? truncate(getDomain(m.faviconUrl) ?? m.faviconUrl)
        : m.url
          ? `Auto — ${truncate(domain ?? m.url)}`
          : 'Missing',
    },
    {
      label: 'og:image set',
      passed: m.ogImage.startsWith('http'),
      info: m.ogImage ? truncate(getDomain(m.ogImage) ?? m.ogImage) : 'Missing',
    },
    {
      label: 'og:title set',
      passed: titleLen > 0,
      info: titleLen > 0 ? `"${truncate(m.title, 35)}"` : 'Missing',
    },
    {
      label: 'og:description set',
      passed: descLen > 0,
      info: descLen > 0 ? `${descLen} chars` : 'Missing',
    },
    {
      label: 'og:site_name set',
      passed: m.siteName.length > 0,
      info: m.siteName ? truncate(m.siteName) : 'Missing',
    },
    {
      label: 'twitter:site handle',
      passed: m.twitterHandle.startsWith('@') && m.twitterHandle.length > 1,
      info: m.twitterHandle ? truncate(m.twitterHandle) : 'Missing',
    },
    {
      label: 'Theme color',
      passed: /^#[0-9a-fA-F]{6}$/.test(m.themeColor),
      info: m.themeColor || 'Missing',
    },
    { label: 'Language', passed: m.lang.length > 0, info: m.lang ? truncate(m.lang) : 'Missing' },
    {
      label: 'Keywords (≥ 3)',
      passed: m.keywords.trim().split(',').filter(Boolean).length >= 3,
      info: `${m.keywords.trim().split(',').filter(Boolean).length} keywords`,
    },
  ]
}

async function resizeImage(dataUrl: string, size: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, size, size)
      resolve(canvas.toDataURL('image/png'))
    }
    img.src = dataUrl
  })
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl)
  return res.blob()
}

const ICON_SIZES = [16, 32, 48, 72, 96, 128, 144, 152, 192, 256, 384, 512]
const DISPLAY_OPTIONS = ['standalone', 'fullscreen', 'minimal-ui', 'browser']

export default function SeoTool() {
  const copy = useCopyToClipboard()
  const [tab, setTab] = useState<Tab>('preview')
  const [previewMode, setPreviewMode] = useState<PreviewMode>('facebook')

  const [meta, setMeta] = useState<MetaInputs>({
    siteName: '',
    title: '',
    description: '',
    url: '',
    ogImage: '',
    faviconUrl: '',
    twitterHandle: '',
    keywords: '',
    themeColor: '#000000',
    backgroundColor: '#ffffff',
    lang: 'en',
  })

  const [manifest, setManifest] = useState<ManifestInputs>({
    name: '',
    shortName: '',
    description: '',
    startUrl: '/',
    display: 'standalone',
    backgroundColor: '#ffffff',
    themeColor: '#000000',
    lang: 'en',
  })
  const [manifestCopied, setManifestCopied] = useState(false)

  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [generatingZip, setGeneratingZip] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const setMetaField =
    (field: keyof MetaInputs) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setMeta((p) => ({ ...p, [field]: e.target.value }))

  const setManifestField =
    (field: keyof ManifestInputs) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setManifest((p) => ({ ...p, [field]: e.target.value }))

  const checks = buildChecks(meta)
  const passed = checks.filter((c) => c.passed).length
  const score = Math.round((passed / checks.length) * 100)

  const scoreColor =
    score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-destructive'
  const scoreRing =
    score >= 80 ? 'stroke-emerald-500' : score >= 50 ? 'stroke-amber-500' : 'stroke-destructive'
  const circumference = 2 * Math.PI * 36
  const dashOffset = circumference - (score / 100) * circumference

  const manifestObj = {
    name: manifest.name,
    short_name: manifest.shortName,
    description: manifest.description,
    start_url: manifest.startUrl,
    display: manifest.display,
    background_color: manifest.backgroundColor,
    theme_color: manifest.themeColor,
    lang: manifest.lang,
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable any',
      },
    ],
  }
  const manifestJson = JSON.stringify(manifestObj, null, 2)

  const handleCopyManifest = useCallback(async () => {
    await copy(manifestJson)
    setManifestCopied(true)
    setTimeout(() => setManifestCopied(false), 2000)
  }, [copy, manifestJson])

  const handleDownloadManifest = useCallback(() => {
    const blob = new Blob([manifestJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'manifest.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [manifestJson])

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setUploadedImage(ev.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleGenerateZip = useCallback(async () => {
    if (!uploadedImage) return
    setGeneratingZip(true)
    try {
      const zip = new JSZip()
      for (const size of ICON_SIZES) {
        const resized = await resizeImage(uploadedImage, size)
        const blob = await dataUrlToBlob(resized)
        zip.file(`icons/icon-${size}x${size}.png`, blob)
      }
      zip.file('manifest.json', manifestJson)
      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = 'seo-assets.zip'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setGeneratingZip(false)
    }
  }, [uploadedImage, manifestJson])

  const tabs: { id: Tab; label: string }[] = [
    { id: 'preview', label: 'Preview & Score' },
    { id: 'manifest', label: 'manifest.json' },
    { id: 'assets', label: 'Image Assets' },
  ]

  return (
    <ToolLayout
      title="SEO Toolkit"
      description="Preview social share cards, score your metadata, generate manifest.json, and export favicon assets"
      icon={SearchCheck}
    >
      <div className="flex gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground dark:hover:text-foreground hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'preview' && (
        <div className="grid gap-6 overflow-hidden lg:grid-cols-[320px_1fr]">
          <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5">
            <h3 className="text-foreground text-sm font-semibold">Metadata</h3>
            <div>
              <Label className="text-muted-foreground text-xs">Site Name</Label>
              <Input
                value={meta.siteName}
                onChange={setMetaField('siteName')}
                placeholder="My Website"
                maxLength={50}
                className="bg-secondary border-border text-foreground mt-1"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Page Title</Label>
              <Input
                value={meta.title}
                onChange={setMetaField('title')}
                placeholder="Home | My Website"
                maxLength={60}
                className="bg-secondary border-border text-foreground mt-1"
              />
              <p className="text-muted-foreground mt-0.5 text-xs">{meta.title.length}/60</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Meta Description</Label>
              <textarea
                value={meta.description}
                onChange={setMetaField('description')}
                placeholder="A brief description…"
                rows={3}
                maxLength={160}
                className="border-border bg-secondary text-foreground placeholder:text-muted-foreground mt-1 w-full resize-none overflow-x-hidden rounded-lg border px-3 py-2 text-sm break-all focus:outline-none"
              />
              <p className="text-muted-foreground -mt-1 text-xs">{meta.description.length}/160</p>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Canonical URL</Label>
              <Input
                value={meta.url}
                onChange={setMetaField('url')}
                placeholder="https://example.com/page"
                className="bg-secondary border-border text-foreground mt-1"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">OG Image URL</Label>
              <Input
                value={meta.ogImage}
                onChange={setMetaField('ogImage')}
                placeholder="https://example.com/og.png"
                className="bg-secondary border-border text-foreground mt-1"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">
                Favicon URL{' '}
                <span className="text-muted-foreground font-normal">
                  (optional — auto-detected if URL is set)
                </span>
              </Label>
              <Input
                value={meta.faviconUrl}
                onChange={setMetaField('faviconUrl')}
                placeholder="https://example.com/favicon.ico"
                className="bg-secondary border-border text-foreground mt-1"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Keywords (comma-separated)</Label>
              <Input
                value={meta.keywords}
                onChange={setMetaField('keywords')}
                placeholder="nextjs, react, tools"
                className="bg-secondary border-border text-foreground mt-1"
              />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Twitter Handle</Label>
              <Input
                value={meta.twitterHandle}
                onChange={setMetaField('twitterHandle')}
                placeholder="@username"
                className="bg-secondary border-border text-foreground mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { key: 'themeColor', label: 'Theme Color' },
                  { key: 'backgroundColor', label: 'BG Color' },
                ] as const
              ).map((f) => (
                <div key={f.key}>
                  <Label className="text-muted-foreground text-xs">{f.label}</Label>
                  <div className="mt-1 flex gap-1.5">
                    <input
                      type="color"
                      value={meta[f.key]}
                      onChange={setMetaField(f.key)}
                      className="border-border h-9 w-9 cursor-pointer rounded-lg border bg-transparent"
                    />
                    <Input
                      value={meta[f.key]}
                      onChange={setMetaField(f.key)}
                      className="bg-secondary border-border text-foreground font-mono text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Language</Label>
              <Input
                value={meta.lang}
                onChange={setMetaField('lang')}
                placeholder="en"
                className="bg-secondary border-border text-foreground mt-1"
              />
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-4 overflow-hidden">
            <div className="border-border bg-card w-full min-w-0 overflow-hidden rounded-xl border p-5">
              <div className="mb-4 flex items-center gap-5">
                <div className="relative h-20 w-20 shrink-0">
                  <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80">
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      fill="none"
                      className="stroke-secondary"
                      strokeWidth="7"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      fill="none"
                      className={scoreRing}
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                      style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-xl font-bold ${scoreColor}`}>{score}</span>
                    <span className="text-muted-foreground text-[10px]">/ 100</span>
                  </div>
                </div>
                <div>
                  <p className="text-foreground text-lg font-bold">
                    {score >= 80 ? 'Good' : score >= 50 ? 'Needs Work' : 'Poor'}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {passed}/{checks.length} checks passed
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                {checks.map((c) => (
                  <div
                    key={c.label}
                    className={`border-border flex items-start gap-3 overflow-hidden rounded-lg border px-3 py-2.5 ${c.passed ? 'bg-emerald-500/5' : c.warn ? 'bg-amber-500/5' : 'bg-destructive/5'}`}
                  >
                    {c.passed ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    ) : c.warn ? (
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    ) : (
                      <XCircle className="text-destructive mt-0.5 h-4 w-4 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground truncate text-sm font-medium">{c.label}</p>
                      <p className="text-muted-foreground line-clamp-2 overflow-hidden text-xs">
                        {c.info}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-border bg-card w-full min-w-0 overflow-hidden rounded-xl border p-5">
              <div className="mb-3 flex gap-1.5">
                {(['facebook', 'twitter', 'google'] as PreviewMode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setPreviewMode(m)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${previewMode === m ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground dark:hover:text-foreground hover:text-foreground'}`}
                  >
                    {m === 'facebook'
                      ? 'Facebook / OG'
                      : m === 'twitter'
                        ? 'Twitter / X'
                        : 'Google'}
                  </button>
                ))}
              </div>

              {previewMode === 'google' &&
                (() => {
                  const domain = getDomain(meta.url) || 'example.com'
                  const faviconSrc =
                    meta.faviconUrl ||
                    (meta.url.startsWith('http')
                      ? `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=${encodeURIComponent(meta.url)}&size=32`
                      : null)
                  let breadcrumb = domain
                  try {
                    const parsed = new URL(
                      meta.url.startsWith('http') ? meta.url : `https://${meta.url}`,
                    )
                    const path = parsed.pathname.replace(/\/$/, '')
                    breadcrumb = path ? `${domain} › ${path.slice(1)}` : domain
                  } catch {}
                  return (
                    <div className="w-full max-w-xl min-w-0 overflow-hidden">
                      <div className="flex min-w-0 items-center gap-2">
                        {faviconSrc ? (
                          <img
                            src={faviconSrc}
                            alt="favicon"
                            className="h-4 w-4 shrink-0 rounded-sm object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="bg-secondary h-4 w-4 shrink-0 rounded-sm" />
                        )}
                        <p className="text-muted-foreground min-w-0 truncate text-xs">
                          {breadcrumb}
                        </p>
                      </div>
                      <p className="mt-1 line-clamp-1 min-w-0 truncate text-lg font-medium text-blue-500">
                        {meta.title || 'Page Title'}
                      </p>
                      <p className="text-muted-foreground mt-0.5 line-clamp-2 min-w-0 overflow-hidden text-sm leading-relaxed">
                        {meta.description || 'Meta description will appear here…'}
                      </p>
                    </div>
                  )
                })()}

              {previewMode === 'facebook' && (
                <div className="border-border overflow-hidden rounded-xl border">
                  {meta.ogImage ? (
                    <img
                      src={meta.ogImage}
                      alt="OG"
                      className="aspect-[1.91/1] w-full object-cover"
                    />
                  ) : (
                    <div className="bg-secondary text-muted-foreground flex aspect-[1.91/1] items-center justify-center gap-2 text-xs">
                      <ImageIcon className="h-5 w-5" /> No OG image URL
                    </div>
                  )}
                  <div className="bg-secondary/60 border-border min-w-0 overflow-hidden border-t px-4 py-3">
                    <p className="text-muted-foreground min-w-0 truncate text-xs uppercase">
                      {getDomain(meta.url) || 'example.com'}
                    </p>
                    <p className="text-foreground mt-0.5 line-clamp-1 min-w-0 truncate font-semibold">
                      {meta.title || 'Page Title'}
                    </p>
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 min-w-0 overflow-hidden text-sm">
                      {meta.description || 'Description'}
                    </p>
                  </div>
                </div>
              )}

              {previewMode === 'twitter' && (
                <div className="border-border overflow-hidden rounded-2xl border">
                  {meta.ogImage ? (
                    <img
                      src={meta.ogImage}
                      alt="Twitter"
                      className="aspect-[1.91/1] w-full object-cover"
                    />
                  ) : (
                    <div className="bg-secondary text-muted-foreground flex aspect-[1.91/1] items-center justify-center gap-2 text-xs">
                      <ImageIcon className="h-5 w-5" /> No OG image URL
                    </div>
                  )}
                  <div className="bg-secondary/60 min-w-0 overflow-hidden px-4 py-3">
                    <p className="text-foreground line-clamp-1 min-w-0 truncate font-semibold">
                      {meta.title || 'Page Title'}
                    </p>
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 min-w-0 overflow-hidden text-sm">
                      {meta.description || 'Description'}
                    </p>
                    <p className="text-muted-foreground mt-1 min-w-0 truncate text-xs">
                      {getDomain(meta.url) || 'example.com'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'manifest' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5">
            <h3 className="text-foreground text-sm font-semibold">App Info</h3>
            {(
              [
                { key: 'name', label: 'App Name', placeholder: 'My App' },
                { key: 'shortName', label: 'Short Name', placeholder: 'App' },
                { key: 'description', label: 'Description', placeholder: 'A great web app' },
                { key: 'startUrl', label: 'Start URL', placeholder: '/' },
                { key: 'lang', label: 'Language', placeholder: 'en' },
              ] as const
            ).map((f) => (
              <div key={f.key}>
                <Label className="text-muted-foreground text-xs">{f.label}</Label>
                <Input
                  value={manifest[f.key]}
                  onChange={setManifestField(f.key)}
                  placeholder={f.placeholder}
                  className="bg-secondary border-border text-foreground mt-1"
                />
              </div>
            ))}
            <div>
              <Label className="text-muted-foreground text-xs">Display Mode</Label>
              <select
                value={manifest.display}
                onChange={setManifestField('display')}
                className="border-border bg-secondary text-foreground mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
              >
                {DISPLAY_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { key: 'themeColor', label: 'Theme Color' },
                  { key: 'backgroundColor', label: 'BG Color' },
                ] as const
              ).map((f) => (
                <div key={f.key}>
                  <Label className="text-muted-foreground text-xs">{f.label}</Label>
                  <div className="mt-1 flex gap-1.5">
                    <input
                      type="color"
                      value={manifest[f.key]}
                      onChange={setManifestField(f.key)}
                      className="border-border h-9 w-9 cursor-pointer rounded-lg border bg-transparent"
                    />
                    <Input
                      value={manifest[f.key]}
                      onChange={setManifestField(f.key)}
                      className="bg-secondary border-border text-foreground font-mono text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-border bg-card flex flex-col rounded-xl border p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="text-primary h-4 w-4" />
                <p className="text-foreground text-sm font-semibold">manifest.json</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void handleCopyManifest()
                  }}
                  className="text-muted-foreground dark:hover:text-foreground h-7 gap-1 text-xs hover:text-white"
                >
                  {manifestCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {manifestCopied ? 'Copied' : 'Copy'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadManifest}
                  className="text-muted-foreground dark:hover:text-foreground h-7 gap-1 text-xs hover:text-white"
                >
                  <Download className="h-3 w-3" /> Download
                </Button>
              </div>
            </div>
            <pre className="border-border bg-secondary/50 text-foreground flex-1 overflow-auto rounded-lg border px-4 py-3 font-mono text-xs leading-relaxed">
              {manifestJson}
            </pre>
          </div>
        </div>
      )}

      {tab === 'assets' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5">
            <div>
              <h3 className="text-foreground text-sm font-semibold">Upload Source Image</h3>
              <p className="text-muted-foreground mt-0.5 text-xs">Square PNG or SVG recommended.</p>
            </div>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-border bg-secondary/50 hover:border-primary/50 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 transition-colors"
            >
              {uploadedImage ? (
                <img
                  src={uploadedImage}
                  alt="Uploaded"
                  className="h-24 w-24 rounded-xl object-contain"
                />
              ) : (
                <ImageIcon className="text-muted-foreground h-10 w-10" />
              )}
              <p className="text-muted-foreground text-xs">
                {uploadedImage ? 'Click to change' : 'Click to upload (PNG, SVG, JPEG)'}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
            <div>
              <p className="text-muted-foreground mb-2 text-xs font-medium">Sizes to generate</p>
              <div className="flex flex-wrap gap-1.5">
                {ICON_SIZES.map((s) => (
                  <span
                    key={s}
                    className="border-border bg-secondary text-muted-foreground rounded-md border px-2 py-1 font-mono text-xs"
                  >
                    {s}×{s}
                  </span>
                ))}
              </div>
            </div>
            <Button
              onClick={() => {
                void handleGenerateZip()
              }}
              disabled={!uploadedImage || generatingZip}
              className="bg-primary text-primary-foreground hover:bg-primary/90 mt-auto gap-2"
            >
              {generatingZip ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {generatingZip ? 'Generating…' : 'Download Icons + manifest.json (.zip)'}
            </Button>
          </div>

          <div className="border-border bg-card flex flex-col gap-2 rounded-xl border p-5">
            <h3 className="text-foreground mb-2 text-sm font-semibold">ZIP Contents Preview</h3>
            {ICON_SIZES.map((s) => (
              <div
                key={s}
                className="border-border bg-secondary/50 flex items-center gap-3 rounded-lg border px-4 py-2"
              >
                <div
                  className="border-border flex shrink-0 items-center justify-center overflow-hidden rounded border bg-white"
                  style={{ width: 28, height: 28 }}
                >
                  {uploadedImage && (
                    <img
                      src={uploadedImage}
                      alt=""
                      style={{ width: Math.min(s, 26), height: Math.min(s, 26) }}
                      className="object-contain"
                    />
                  )}
                </div>
                <span className="text-foreground font-mono text-xs">
                  icons/icon-{s}x{s}.png
                </span>
                <span className="text-muted-foreground ml-auto text-xs">
                  {s}×{s}px
                </span>
              </div>
            ))}
            <div className="border-border bg-secondary/50 flex items-center gap-3 rounded-lg border px-4 py-2">
              <FileJson className="text-primary h-5 w-5 shrink-0" />
              <span className="text-foreground font-mono text-xs">manifest.json</span>
            </div>
          </div>
        </div>
      )}
    </ToolLayout>
  )
}
