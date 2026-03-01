'use client'

import { useState, useRef, useEffect } from 'react'
import { useCopyToClipboard } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Copy, Check, ShieldAlert, ShieldCheck, KeyRound, Play } from 'lucide-react'

import * as jose from 'jose'

export default function JwtBuilder() {
  const [algo, setAlgo] = useState('HS256')
  const [typ, setTyp] = useState('JWT')
  const [payloadText, setPayloadText] = useState(
    '{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "iat": 1516239022\n}',
  )
  const [secret, setSecret] = useState('your-256-bit-secret')

  const [generatedJwt, setGeneratedJwt] = useState('')
  const [errorMSG, setErrorMSG] = useState('')

  const [verifyJwt, setVerifyJwt] = useState('')
  const [verifySecret, setVerifySecret] = useState('')
  const [verifyResult, setVerifyResult] = useState<any>(null)

  const [copied, setCopied] = useState(false)
  const copyToClipboard = useCopyToClipboard()

  const handleGenerate = async () => {
    setErrorMSG('')
    try {
      const payload = JSON.parse(payloadText)

      let secretKey
      if (algo.startsWith('HS')) {
        secretKey = new TextEncoder().encode(secret)
      } else {
        throw new Error('Only HS* algorithms are fully supported in this client-side demo.')
      }

      const jwt = await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: algo, typ: typ })
        .sign(secretKey)

      setGeneratedJwt(jwt)
    } catch (err: any) {
      setErrorMSG(err.message || 'Failed to generate JWT')
      setGeneratedJwt('')
    }
  }

  const handleVerify = async () => {
    if (!verifyJwt) return
    try {
      const unverifiedHeader = jose.decodeProtectedHeader(verifyJwt)
      if (!unverifiedHeader?.alg) throw new Error('Missing algorithm in token header')
      let secretKey
      if (unverifiedHeader.alg.startsWith('HS')) {
        secretKey = new TextEncoder().encode(verifySecret)
      } else {
        throw new Error('Verification for non-HMAC keys requires public key PEM data.')
      }

      const { payload, protectedHeader } = await jose.jwtVerify(verifyJwt, secretKey)
      setVerifyResult({ valid: true, payload, header: protectedHeader })
    } catch (err: any) {
      setVerifyResult({ valid: false, error: err.message })
    }
  }

  const copyOut = () => {
    if (!generatedJwt) return
    copyToClipboard(generatedJwt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tokenParts = generatedJwt ? generatedJwt.split('.') : ['', '', '']

  return (
    <div className="space-y-6">
      <Tabs defaultValue="build">
        <TabsList className="bg-secondary grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="build" className="text-xs">
            Build & Sign
          </TabsTrigger>
          <TabsTrigger value="verify" className="text-xs">
            Verify
          </TabsTrigger>
        </TabsList>

        <TabsContent value="build" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
            <div className="space-y-6">
              <div className="border-border bg-card space-y-4 rounded-xl border p-5">
                <Label className="text-foreground border-border block border-b pb-2 text-sm font-semibold">
                  1. Header
                </Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">Algorithm</Label>
                    <Select value={algo} onValueChange={setAlgo}>
                      <SelectTrigger className="bg-secondary text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HS256">HS256</SelectItem>
                        <SelectItem value="HS384">HS384</SelectItem>
                        <SelectItem value="HS512">HS512</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs">Type (typ)</Label>
                    <Input
                      value={typ}
                      onChange={(e) => setTyp(e.target.value)}
                      className="bg-secondary text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="border-border bg-card space-y-4 rounded-xl border p-5">
                <Label className="text-foreground border-border block border-b pb-2 text-sm font-semibold">
                  2. Payload (JSON)
                </Label>
                <textarea
                  value={payloadText}
                  onChange={(e) => setPayloadText(e.target.value)}
                  className="border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:ring-ring h-48 w-full resize-none rounded-md border p-3 font-mono text-xs leading-relaxed focus:ring-1 focus:outline-none"
                />
              </div>

              <div className="border-border bg-card space-y-4 rounded-xl border p-5">
                <Label className="text-foreground border-border block border-b pb-2 text-sm font-semibold">
                  3. Signature Secret
                </Label>
                <div className="space-y-2">
                  <Input
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    placeholder="Enter HMAC secret string..."
                    className="bg-secondary font-mono text-sm"
                  />
                  <p className="text-muted-foreground text-[10px]">
                    Keep this secure. Used to sign the HMAC segment.
                  </p>
                </div>
                <Button onClick={handleGenerate} className="h-10 w-full gap-2 text-xs">
                  <Play className="h-4 w-4" /> Sign & Generate JWT
                </Button>
                {errorMSG && <p className="text-destructive text-xs">{errorMSG}</p>}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-foreground block px-1 text-sm font-semibold">
                Generated Token
              </Label>
              <div className="border-border bg-card flex h-[450px] flex-col overflow-hidden rounded-xl border">
                <div className="border-border bg-secondary/50 flex items-center justify-end border-b p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyOut}
                    disabled={!generatedJwt}
                    className="h-7 gap-1 text-xs"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    Copy
                  </Button>
                </div>
                <div className="relative flex-1 overflow-auto p-5">
                  {!generatedJwt ? (
                    <div className="text-muted-foreground/50 absolute inset-0 flex items-center justify-center px-6 text-center text-xs">
                      Click Generate to create your JWT
                    </div>
                  ) : (
                    <div className="font-mono text-sm leading-loose break-all">
                      <span className="text-rose-500">{tokenParts[0]}</span>
                      <span className="text-foreground font-bold">.</span>
                      <span className="text-purple-500">{tokenParts[1]}</span>
                      <span className="text-foreground font-bold">.</span>
                      <span className="text-sky-500">{tokenParts[2]}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="verify" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs font-semibold">JWT String</Label>
                <textarea
                  value={verifyJwt}
                  onChange={(e) => setVerifyJwt(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:ring-ring h-32 w-full resize-none rounded-md border p-3 font-mono text-xs leading-relaxed focus:ring-1 focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs font-semibold">
                  Secret Key for Verification
                </Label>
                <Input
                  value={verifySecret}
                  onChange={(e) => setVerifySecret(e.target.value)}
                  placeholder="Secret string used for signing"
                  className="bg-secondary font-mono text-xs"
                />
              </div>
              <Button
                onClick={handleVerify}
                disabled={!verifyJwt || !verifySecret}
                className="h-10 w-full gap-2"
              >
                <KeyRound className="h-4 w-4" /> Verify Token Signature
              </Button>
            </div>

            <div className="border-border bg-card rounded-xl border p-5">
              <Label className="text-foreground border-border mb-4 block border-b pb-2 text-sm font-semibold">
                Verification Result
              </Label>
              {!verifyResult ? (
                <div className="text-muted-foreground/50 flex h-32 items-center justify-center text-xs">
                  Awaiting verification...
                </div>
              ) : verifyResult.valid ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-emerald-500">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="text-sm font-semibold">Signature Valid</span>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-[10px] uppercase">Header</Label>
                    <pre className="bg-secondary mt-1 overflow-auto rounded-md p-3 font-mono text-xs text-rose-500">
                      {JSON.stringify(verifyResult.header, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-[10px] uppercase">Payload</Label>
                    <pre className="bg-secondary mt-1 overflow-auto rounded-md p-3 font-mono text-xs text-purple-500">
                      {JSON.stringify(verifyResult.payload, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-3 py-10 text-center">
                  <div className="bg-destructive/10 rounded-full p-3">
                    <ShieldAlert className="text-destructive h-8 w-8" />
                  </div>
                  <h3 className="text-destructive font-semibold">Invalid Signature</h3>
                  <p className="text-destructive/80 max-w-xs text-xs">{verifyResult.error}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
