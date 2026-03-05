'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Download, LayoutPanelLeft, Wifi, User, Image as ImageIcon } from 'lucide-react'
import { ToolLayout } from '@/components/tool-layout'
import { tools } from '@/lib/tools'

import QRCode from 'qrcode'

export default function QrCodeGenerator() {
  const tool = tools.find((t) => t.id === 'qr-code-generator')!
  const [mode, setMode] = useState('url')

  const [url, setUrl] = useState('https://next-devtoolkit.vercel.app')

  const [wifiSsid, setWifiSsid] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')
  const [wifiEncryption, setWifiEncryption] = useState('WPA')
  const [wifiHidden, setWifiHidden] = useState(false)

  const [vcardName, setVcardName] = useState('')
  const [vcardPhone, setVcardPhone] = useState('')
  const [vcardEmail, setVcardEmail] = useState('')
  const [vcardOrg, setVcardOrg] = useState('')
  const [vcardUrl, setVcardUrl] = useState('')

  const [totpIssuer, setTotpIssuer] = useState('')
  const [totpAccount, setTotpAccount] = useState('')
  const [totpSecret, setTotpSecret] = useState('')

  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#ffffff')
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('M')
  const [margin, setMargin] = useState(4)

  const canvasRef = useRef<HTMLCanvasElement>(null)

  const getContent = useCallback(() => {
    if (mode === 'url') return url || 'https://'

    if (mode === 'wifi') {
      const escape = (str: string) => str.replace(/([;:])/g, '$1')
      return `WIFI:T:${wifiEncryption};S:${escape(wifiSsid)};P:${escape(wifiPassword)};H:${wifiHidden ? 'true' : 'false'};;`
    }

    if (mode === 'vcard') {
      return `BEGIN:VCARD
VERSION:3.0
FN:${vcardName}
TEL:${vcardPhone}
EMAIL:${vcardEmail}
ORG:${vcardOrg}
URL:${vcardUrl}
END:VCARD`
    }

    if (mode === 'totp') {
      const issuerUrl = encodeURIComponent(totpIssuer)
      const accountUrl = encodeURIComponent(totpAccount)
      return `otpauth://totp/${issuerUrl}:${accountUrl}?secret=${totpSecret}&issuer=${issuerUrl}`
    }

    return ''
  }, [
    mode,
    url,
    wifiSsid,
    wifiPassword,
    wifiEncryption,
    wifiHidden,
    vcardName,
    vcardPhone,
    vcardEmail,
    vcardOrg,
    vcardUrl,
    totpIssuer,
    totpAccount,
    totpSecret,
  ])

  const renderQR = useCallback(async () => {
    if (!canvasRef.current) return
    const content = getContent()

    try {
      await QRCode.toCanvas(canvasRef.current, content || 'empty', {
        width: 300,
        margin: margin,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: errorCorrection,
      })
    } catch {}
  }, [getContent, fgColor, bgColor, errorCorrection, margin])

  useEffect(() => {
    void renderQR()
  }, [renderQR])

  const downloadPNG = () => {
    if (!canvasRef.current) return
    const url = canvasRef.current.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `qr-code-${Date.now()}.png`
    a.click()
  }

  const downloadSVG = async () => {
    const content = getContent()
    try {
      const svgString = await QRCode.toString(content || 'empty', {
        type: 'svg',
        margin: margin,
        color: {
          dark: fgColor,
          light: bgColor,
        },
        errorCorrectionLevel: errorCorrection,
      })
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qr-code-${Date.now()}.svg`
      a.click()
      URL.revokeObjectURL(url)
    } catch {}
  }

  return (
    <ToolLayout title={tool.name} description={tool.description} icon={tool.icon}>
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList className="bg-secondary grid w-full grid-cols-4">
              <TabsTrigger value="url" className="text-xs">
                <LayoutPanelLeft className="mr-1.5 h-3.5 w-3.5" /> URL
              </TabsTrigger>
              <TabsTrigger value="wifi" className="text-xs">
                <Wifi className="mr-1.5 h-3.5 w-3.5" /> WiFi
              </TabsTrigger>
              <TabsTrigger value="vcard" className="text-xs">
                <User className="mr-1.5 h-3.5 w-3.5" /> vCard
              </TabsTrigger>
              <TabsTrigger value="totp" className="text-xs">
                <ImageIcon className="mr-1.5 h-3.5 w-3.5" /> TOTP
              </TabsTrigger>
            </TabsList>

            <div className="border-border bg-card mt-6 rounded-xl border p-5">
              <TabsContent value="url" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs font-medium">URL</Label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="bg-secondary"
                  />
                </div>
              </TabsContent>

              <TabsContent value="wifi" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs font-medium">
                    Network Name (SSID)
                  </Label>
                  <Input
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="My WiFi Network"
                    className="bg-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs font-medium">Password</Label>
                  <Input
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    type="password"
                    placeholder="WiFi Password"
                    className="bg-secondary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs font-medium">Encryption</Label>
                    <Select value={wifiEncryption} onValueChange={setWifiEncryption}>
                      <SelectTrigger className="bg-secondary text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WPA">WPA/WPA2</SelectItem>
                        <SelectItem value="WEP">WEP</SelectItem>
                        <SelectItem value="nopass">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3 pt-1">
                    <Label className="text-muted-foreground text-xs font-medium">
                      Hidden Network
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Switch checked={wifiHidden} onCheckedChange={setWifiHidden} />
                      <Label className="text-muted-foreground text-[10px]">
                        {wifiHidden ? 'Yes' : 'No'}
                      </Label>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="vcard" className="mt-0 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs font-medium">Full Name</Label>
                    <Input
                      value={vcardName}
                      onChange={(e) => setVcardName(e.target.value)}
                      placeholder="John Doe"
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs font-medium">
                      Organization
                    </Label>
                    <Input
                      value={vcardOrg}
                      onChange={(e) => setVcardOrg(e.target.value)}
                      placeholder="Company Inc."
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs font-medium">
                      Phone Number
                    </Label>
                    <Input
                      value={vcardPhone}
                      onChange={(e) => setVcardPhone(e.target.value)}
                      placeholder="+1 234 567 8900"
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs font-medium">Email</Label>
                    <Input
                      value={vcardEmail}
                      onChange={(e) => setVcardEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-muted-foreground text-xs font-medium">
                      Website (URL)
                    </Label>
                    <Input
                      value={vcardUrl}
                      onChange={(e) => setVcardUrl(e.target.value)}
                      placeholder="https://johndoe.com"
                      className="bg-secondary"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="totp" className="mt-0 space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs font-medium">
                    Issuer (App Name)
                  </Label>
                  <Input
                    value={totpIssuer}
                    onChange={(e) => setTotpIssuer(e.target.value)}
                    placeholder="Service Name"
                    className="bg-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs font-medium">Account Name</Label>
                  <Input
                    value={totpAccount}
                    onChange={(e) => setTotpAccount(e.target.value)}
                    placeholder="user@example.com"
                    className="bg-secondary"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs font-medium">
                    Secret Key (Base32)
                  </Label>
                  <Input
                    value={totpSecret}
                    onChange={(e) => setTotpSecret(e.target.value)}
                    placeholder="JBSWY3DPEHPK3PXP"
                    className="bg-secondary font-mono uppercase"
                  />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
        <div className="space-y-6">
          <div className="border-border bg-card flex min-h-[300px] flex-col items-center justify-center rounded-xl border p-6 shadow-sm">
            <canvas ref={canvasRef} className="max-w-full rounded-md" />
          </div>

          <div className="border-border bg-card space-y-5 rounded-xl border p-5">
            <Label className="text-foreground text-sm font-semibold">Customization</Label>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase">
                  Foreground
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="bg-secondary h-8 w-12 cursor-pointer p-1"
                  />
                  <Input
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="bg-secondary h-8 flex-1 font-mono text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase">
                  Background
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="bg-secondary h-8 w-12 cursor-pointer p-1"
                  />
                  <Input
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="bg-secondary h-8 flex-1 font-mono text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase">
                Error Correction
              </Label>
              <Select
                value={errorCorrection}
                onValueChange={(v) => setErrorCorrection(v as 'L' | 'M' | 'Q' | 'H')}
              >
                <SelectTrigger className="bg-secondary h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">Low (7%)</SelectItem>
                  <SelectItem value="M">Medium (15%)</SelectItem>
                  <SelectItem value="Q">Quartile (25%)</SelectItem>
                  <SelectItem value="H">High (30%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-[10px] font-medium tracking-widest uppercase">
                  Quiet Zone (Margin)
                </Label>
                <span className="text-primary font-mono text-xs">{margin} px</span>
              </div>
              <Slider
                value={[margin]}
                onValueChange={([v]) => setMargin(v)}
                min={0}
                max={10}
                step={1}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <Button
                onClick={downloadPNG}
                variant="outline"
                className="text-muted-foreground dark:hover:text-foreground h-9 w-full gap-1.5 text-xs hover:text-white"
              >
                <Download className="h-3.5 w-3.5" /> PNG
              </Button>
              <Button
                onClick={() => {
                  void downloadSVG()
                }}
                variant="outline"
                className="text-muted-foreground dark:hover:text-foreground h-9 w-full gap-1.5 text-xs hover:text-white"
              >
                <Download className="h-3.5 w-3.5" /> SVG
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}
