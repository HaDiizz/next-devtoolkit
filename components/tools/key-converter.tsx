'use client'

import { useState } from 'react'
import {
  Key,
  Shield,
  ShieldCheck,
  RefreshCw,
  Copy,
  CheckCircle2,
  FileText,
  Check,
  X,
  Lock,
  Unlock,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ToolLayout } from '@/components/tool-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

interface KeyPairResult {
  privatePem: string
  publicPem: string
  privateJwk: string
  publicJwk: string
  privateFingerprint: string
  publicFingerprint: string
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = ''
  const bytes = new Uint8Array(buffer)
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

function base64ToPem(base64: string, type: string): string {
  const lines = []
  for (let i = 0; i < base64.length; i += 64) {
    lines.push(base64.slice(i, i + 64))
  }
  return `-----BEGIN ${type}-----\n${lines.join('\n')}\n-----END ${type}-----`
}

function pemToBase64(pem: string): string {
  return pem
    .replace(/-----BEGIN[^-]+-----/g, '')
    .replace(/-----END[^-]+-----/g, '')
    .replace(/\s+/g, '')
}

async function computeSha256Fingerprint(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(':')
    .toUpperCase()
}

async function importKey(
  input: string,
  isPrivate: boolean,
): Promise<{ key: CryptoKey; algorithm: string; curveOrSize: string }> {
  const trimmed = input.trim()
  if (trimmed.startsWith('{')) {
    const jwk = JSON.parse(trimmed) as JsonWebKey
    const isRsa = jwk.kty === 'RSA'
    const name = isRsa ? 'RSASSA-PKCS1-v1_5' : 'ECDSA'
    const curveOrSize = isRsa
      ? `${Math.round((jwk.n ? jwk.n.length * 6 : 2048) / 8) * 8} bits`
      : jwk.crv || 'P-256'
    const algo = isRsa ? { name, hash: 'SHA-256' } : { name, namedCurve: jwk.crv || 'P-256' }
    const usages: KeyUsage[] = isPrivate ? ['sign'] : ['verify']
    const key = await window.crypto.subtle.importKey('jwk', jwk, algo, true, usages)
    return { key, algorithm: name, curveOrSize }
  } else {
    const base64 = pemToBase64(trimmed)
    const buffer = base64ToArrayBuffer(base64)
    const format: 'pkcs8' | 'spki' = isPrivate ? 'pkcs8' : 'spki'
    const usages: KeyUsage[] = isPrivate ? ['sign'] : ['verify']

    try {
      const key = await window.crypto.subtle.importKey(
        format,
        buffer,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        true,
        usages,
      )
      return { key, algorithm: 'RSASSA-PKCS1-v1_5', curveOrSize: 'RSA' }
    } catch {}

    try {
      const key = await window.crypto.subtle.importKey(
        format,
        buffer,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        true,
        isPrivate ? (['decrypt'] as KeyUsage[]) : (['encrypt'] as KeyUsage[]),
      )
      return { key, algorithm: 'RSA-OAEP', curveOrSize: 'RSA' }
    } catch {}

    const curves = ['P-256', 'P-384', 'P-521']
    for (const curve of curves) {
      try {
        const key = await window.crypto.subtle.importKey(
          format,
          buffer,
          { name: 'ECDSA', namedCurve: curve },
          true,
          usages,
        )
        return { key, algorithm: 'ECDSA', curveOrSize: curve }
      } catch {}
    }

    throw new Error('Unsupported key structure or invalid algorithm.')
  }
}

export default function KeyConverterTool() {
  const [activePanel, setActivePanel] = useState<'generate' | 'convert' | 'sign' | 'verify'>(
    'generate',
  )

  const [keyType, setKeyType] = useState<'rsa' | 'ecdsa'>('rsa')
  const [rsaSize, setRsaSize] = useState<2048 | 4096>(2048)
  const [rsaHash, setRsaHash] = useState<'SHA-256' | 'SHA-384' | 'SHA-512'>('SHA-256')
  const [ecdsaCurve, setEcdsaCurve] = useState<'P-256' | 'P-384' | 'P-521'>('P-256')

  const [generatedKeys, setGeneratedKeys] = useState<KeyPairResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const [convertInput, setConvertInput] = useState('')
  const [convertResult, setConvertResult] = useState<{
    type: string
    algo: string
    details: string
    value: string
    label: string
    fingerprint?: string
  } | null>(null)

  const [signMessageText, setSignMessageText] = useState('')
  const [signKeyInput, setSignKeyInput] = useState('')
  const [signatureHex, setSignatureHex] = useState('')
  const [signatureBase64, setSignatureBase64] = useState('')
  const [signedAlgo, setSignedAlgo] = useState('')
  const [sigLength, setSigLength] = useState<number>(0)

  const [verifyMessageText, setVerifyMessageText] = useState('')
  const [verifyKeyInput, setVerifyKeyInput] = useState('')
  const [verifySignatureText, setVerifySignatureText] = useState('')
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null)
  const [verifiedAlgo, setVerifiedAlgo] = useState('')
  const [verifiedKeyType, setVerifiedKeyType] = useState('')

  const generateKeys = async () => {
    setLoading(true)
    try {
      let keyPair: CryptoKeyPair
      if (keyType === 'rsa') {
        keyPair = await window.crypto.subtle.generateKey(
          {
            name: 'RSASSA-PKCS1-v1_5',
            modulusLength: rsaSize,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: rsaHash,
          },
          true,
          ['sign', 'verify'],
        )
      } else {
        keyPair = await window.crypto.subtle.generateKey(
          {
            name: 'ECDSA',
            namedCurve: ecdsaCurve,
          },
          true,
          ['sign', 'verify'],
        )
      }

      const privateBuffer = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey)
      const publicBuffer = await window.crypto.subtle.exportKey('spki', keyPair.publicKey)

      const privatePem = base64ToPem(arrayBufferToBase64(privateBuffer), 'PRIVATE KEY')
      const publicPem = base64ToPem(arrayBufferToBase64(publicBuffer), 'PUBLIC KEY')

      const privateJwkObj = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey)
      const publicJwkObj = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey)

      const privateJwk = JSON.stringify(privateJwkObj, null, 2)
      const publicJwk = JSON.stringify(publicJwkObj, null, 2)

      const privateFingerprint = await computeSha256Fingerprint(privateBuffer)
      const publicFingerprint = await computeSha256Fingerprint(publicBuffer)

      setGeneratedKeys({
        privatePem,
        publicPem,
        privateJwk,
        publicJwk,
        privateFingerprint,
        publicFingerprint,
      })
      toast.success('Secure key pair generated successfully!')
    } catch {
      toast.error('Failed to generate key pair.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text: string, id: string) => {
    void navigator.clipboard.writeText(text)
    setCopiedKey(id)
    setTimeout(() => setCopiedKey(null), 2000)
    toast.success('Copied to clipboard!')
  }

  const handleConvert = async () => {
    if (!convertInput.trim()) return
    try {
      const trimmed = convertInput.trim()
      const isJwk = trimmed.startsWith('{')
      let isPrivate = false

      if (isJwk) {
        const jwk = JSON.parse(trimmed)
        isPrivate = !!jwk.d
      } else {
        isPrivate = trimmed.includes('PRIVATE KEY')
      }

      const { key, algorithm, curveOrSize } = await importKey(trimmed, isPrivate)
      const format = isPrivate ? 'pkcs8' : 'spki'
      const exported = await window.crypto.subtle.exportKey(format, key)
      const fingerprint = await computeSha256Fingerprint(exported)

      if (isJwk) {
        const pemType = isPrivate ? 'PRIVATE KEY' : 'PUBLIC KEY'
        const pem = base64ToPem(arrayBufferToBase64(exported), pemType)
        setConvertResult({
          type: isPrivate ? 'Private Key' : 'Public Key',
          algo: algorithm,
          details: curveOrSize,
          value: pem,
          label: `PEM (${pemType})`,
          fingerprint,
        })
      } else {
        const jwk = await window.crypto.subtle.exportKey('jwk', key)
        const jwkString = JSON.stringify(jwk, null, 2)
        setConvertResult({
          type: isPrivate ? 'Private Key' : 'Public Key',
          algo: algorithm,
          details: curveOrSize,
          value: jwkString,
          label: 'JSON Web Key (JWK)',
          fingerprint,
        })
      }
      toast.success('Key converted successfully!')
    } catch {
      toast.error('Failed to parse and convert key. Make sure format is correct.')
    }
  }

  const handleSign = async () => {
    if (!signMessageText || !signKeyInput) {
      toast.error('Please provide both the message and private key.')
      return
    }
    try {
      const { key, algorithm } = await importKey(signKeyInput, true)
      const encoder = new TextEncoder()
      const data = encoder.encode(signMessageText)

      let signatureBuffer: ArrayBuffer
      if (algorithm === 'RSASSA-PKCS1-v1_5') {
        signatureBuffer = await window.crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, data)
      } else if (algorithm === 'ECDSA') {
        signatureBuffer = await window.crypto.subtle.sign(
          {
            name: 'ECDSA',
            hash: { name: 'SHA-256' },
          },
          key,
          data,
        )
      } else {
        throw new Error('Key type not supported for signing. Use RSASSA-PKCS1-v1_5 or ECDSA.')
      }

      const bytes = new Uint8Array(signatureBuffer)
      const hex = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
      const b64 = btoa(String.fromCharCode(...bytes))

      setSignatureHex(hex)
      setSignatureBase64(b64)
      setSignedAlgo(algorithm)
      setSigLength(signatureBuffer.byteLength)
      toast.success('Signature generated!')
    } catch (e) {
      const err = e as Error
      toast.error(err.message || 'Signing failed. Ensure you used a valid Private Key.')
    }
  }

  const handleVerify = async () => {
    if (!verifyMessageText || !verifyKeyInput || !verifySignatureText) {
      toast.error('All fields are required.')
      return
    }
    try {
      const { key, algorithm } = await importKey(verifyKeyInput, false)
      const encoder = new TextEncoder()
      const data = encoder.encode(verifyMessageText)

      let sigBuffer: ArrayBuffer
      const cleanedSig = verifySignatureText.trim()
      if (/^[0-9a-fA-F]+$/.test(cleanedSig)) {
        const bytes = new Uint8Array(cleanedSig.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)))
        sigBuffer = bytes.buffer
      } else {
        sigBuffer = base64ToArrayBuffer(cleanedSig)
      }

      let valid = false
      if (algorithm === 'RSASSA-PKCS1-v1_5') {
        valid = await window.crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sigBuffer, data)
      } else if (algorithm === 'ECDSA') {
        valid = await window.crypto.subtle.verify(
          {
            name: 'ECDSA',
            hash: { name: 'SHA-256' },
          },
          key,
          sigBuffer,
          data,
        )
      } else {
        throw new Error('Key type not supported for verification.')
      }

      setVerificationResult(valid)
      if (valid) {
        setVerifiedAlgo(algorithm)
        setVerifiedKeyType(key.type)
        toast.success('Signature is valid!')
      } else {
        toast.error('Signature is INVALID.')
      }
    } catch {
      setVerificationResult(false)
      toast.error('Verification failed. Check your public key, message, and signature.')
    }
  }

  return (
    <ToolLayout
      title="Key Pair Generator & Converter"
      description="Cryptographically secure RSA and ECDSA key generator, PEM/JWK converter, and asymmetric signature suite"
      icon={Key}
    >
      <Tabs
        value={activePanel}
        onValueChange={(v) => {
          setActivePanel(v as 'generate' | 'convert' | 'sign' | 'verify')
        }}
      >
        <div className="w-full overflow-x-auto overflow-y-hidden pb-1 md:overflow-x-visible md:overflow-y-visible md:pb-0">
          <TabsList className="bg-secondary flex h-10 w-max min-w-full gap-1 p-1 md:grid md:w-full md:grid-cols-4">
            <TabsTrigger
              value="generate"
              className="h-full flex-1 gap-1.5 px-3 text-xs font-semibold transition-all duration-200 md:flex-initial md:px-0"
            >
              <RefreshCw className="animate-spin-slow h-4 w-4" />
              Generate Pair
            </TabsTrigger>
            <TabsTrigger
              value="convert"
              className="h-full flex-1 gap-1.5 px-3 text-xs font-semibold transition-all duration-200 md:flex-initial md:px-0"
            >
              <FileText className="h-4 w-4" />
              Convert Key
            </TabsTrigger>
            <TabsTrigger
              value="sign"
              className="h-full flex-1 gap-1.5 px-3 text-xs font-semibold transition-all duration-200 md:flex-initial md:px-0"
            >
              <Lock className="h-4 w-4" />
              Sign Message
            </TabsTrigger>
            <TabsTrigger
              value="verify"
              className="h-full flex-1 gap-1.5 px-3 text-xs font-semibold transition-all duration-200 md:flex-initial md:px-0"
            >
              <Unlock className="h-4 w-4" />
              Verify Signature
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="generate" className="mt-4 flex flex-col gap-6">
          <div className="border-border from-card via-card to-secondary/15 flex flex-col gap-5 rounded-xl border bg-gradient-to-br p-5 shadow-sm">
            <div className="flex flex-col gap-1 border-b pb-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
                  <Key className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-foreground text-sm font-bold">Key Configuration Dashboard</h3>
                  <p className="text-muted-foreground text-[11px]">
                    Select your cryptographic type and size parameters to build secure couples
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs font-semibold">
                  Key Architecture Type
                </Label>
                <Select value={keyType} onValueChange={(v) => setKeyType(v as 'rsa' | 'ecdsa')}>
                  <SelectTrigger className="bg-secondary/50 border-border/80 hover:bg-secondary mt-1.5 h-10 text-xs transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rsa">RSA (Signature)</SelectItem>
                    <SelectItem value="ecdsa">ECDSA (Elliptic Curve)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {keyType === 'rsa' ? (
                <>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs font-semibold">
                      Key Bit Size
                    </Label>
                    <Select
                      value={String(rsaSize)}
                      onValueChange={(v) => setRsaSize(Number(v) as 2048 | 4096)}
                    >
                      <SelectTrigger className="bg-secondary/50 border-border/80 hover:bg-secondary mt-1.5 h-10 text-xs transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2048">2048-bit (Standard)</SelectItem>
                        <SelectItem value="4096">4096-bit (Ultra-Secure)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs font-semibold">
                      Hashing Algorithm
                    </Label>
                    <Select
                      value={rsaHash}
                      onValueChange={(v) => setRsaHash(v as 'SHA-256' | 'SHA-384' | 'SHA-512')}
                    >
                      <SelectTrigger className="bg-secondary/50 border-border/80 hover:bg-secondary mt-1.5 h-10 text-xs transition-colors">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SHA-256">SHA-256</SelectItem>
                        <SelectItem value="SHA-384">SHA-384</SelectItem>
                        <SelectItem value="SHA-512">SHA-512</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Elliptic Named Curve
                  </Label>
                  <Select
                    value={ecdsaCurve}
                    onValueChange={(v) => setEcdsaCurve(v as 'P-256' | 'P-384' | 'P-521')}
                  >
                    <SelectTrigger className="bg-secondary/50 border-border/80 hover:bg-secondary mt-1.5 h-10 text-xs transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P-256">NIST P-256 (prime256v1)</SelectItem>
                      <SelectItem value="P-384">NIST P-384 (secp384r1)</SelectItem>
                      <SelectItem value="P-521">NIST P-521</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Button
              onClick={() => {
                void generateKeys()
              }}
              disabled={loading}
              className="relative h-11 w-full gap-2 overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-500 font-semibold text-white shadow-md shadow-emerald-500/10 transition-all duration-200 hover:from-emerald-600 hover:to-teal-600 hover:shadow-emerald-500/20 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating Cryptographic Key Pair...
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Generate Cryptographic Key Pair
                </>
              )}
            </Button>
          </div>

          {generatedKeys && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-foreground flex items-center gap-1.5 text-sm font-bold">
                    <Lock className="h-4 w-4 text-emerald-500" />
                    Private Key (Secret)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSignKeyInput(generatedKeys.privatePem)
                        setSignMessageText('Test Signature Payload')
                        setActivePanel('sign')
                        toast.success('Private key loaded into Signer!')
                      }}
                      className="h-8 border-emerald-500/30 bg-emerald-500/5 px-3 text-[10px] font-bold text-emerald-500 transition-all duration-200 hover:bg-emerald-500/10 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
                    >
                      Use in Signer
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="bg-secondary/20 border-border flex flex-col gap-1.5 rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                        SHA-256 Fingerprint
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-border bg-secondary/50 text-muted-foreground h-7 w-7 shrink-0 p-0 hover:text-white"
                        onClick={() => handleCopy(generatedKeys.privateFingerprint, 'privFp')}
                      >
                        {copiedKey === 'privFp' ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    <div className="font-mono text-xs leading-normal font-semibold break-all text-emerald-600 select-all dark:text-emerald-400">
                      {generatedKeys.privateFingerprint}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                        PEM Format (PKCS#8)
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-border bg-secondary/50 text-muted-foreground h-7 w-7 shrink-0 p-0 hover:text-white"
                        onClick={() => handleCopy(generatedKeys.privatePem, 'privPem')}
                      >
                        {copiedKey === 'privPem' ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    <textarea
                      readOnly
                      value={generatedKeys.privatePem}
                      rows={6}
                      className="border-border bg-secondary/20 hover:bg-secondary/35 text-foreground/90 w-full resize-none rounded-lg border p-3 font-mono text-[10px] leading-tight transition-all focus:ring-1 focus:ring-emerald-500/30 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                        JWK Format (JSON)
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-border bg-secondary/50 text-muted-foreground h-7 w-7 shrink-0 p-0 hover:text-white"
                        onClick={() => handleCopy(generatedKeys.privateJwk, 'privJwk')}
                      >
                        {copiedKey === 'privJwk' ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    <textarea
                      readOnly
                      value={generatedKeys.privateJwk}
                      rows={6}
                      className="border-border bg-secondary/20 hover:bg-secondary/35 text-foreground/90 w-full resize-none rounded-lg border p-3 font-mono text-[10px] leading-tight transition-all focus:ring-1 focus:ring-emerald-500/30 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-foreground flex items-center gap-1.5 text-sm font-bold">
                    <Unlock className="h-4 w-4 text-blue-500" />
                    Public Key (Shareable)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setVerifyKeyInput(generatedKeys.publicPem)
                        setVerifyMessageText('Test Signature Payload')
                        setActivePanel('verify')
                        toast.success('Public key loaded into Verifier!')
                      }}
                      className="h-8 border-blue-500/30 bg-blue-500/5 px-3 text-[10px] font-bold text-blue-500 transition-all duration-200 hover:bg-blue-500/10 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      Use in Verifier
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="bg-secondary/20 border-border flex flex-col gap-1.5 rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                        SHA-256 Fingerprint
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-border bg-secondary/50 text-muted-foreground h-7 w-7 shrink-0 p-0 hover:text-white"
                        onClick={() => handleCopy(generatedKeys.publicFingerprint, 'pubFp')}
                      >
                        {copiedKey === 'pubFp' ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    <div className="font-mono text-xs leading-normal font-semibold break-all text-blue-600 select-all dark:text-blue-400">
                      {generatedKeys.publicFingerprint}
                    </div>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                        PEM Format (SPKI)
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-border bg-secondary/50 text-muted-foreground h-7 w-7 shrink-0 p-0 hover:text-white"
                        onClick={() => handleCopy(generatedKeys.publicPem, 'pubPem')}
                      >
                        {copiedKey === 'pubPem' ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    <textarea
                      readOnly
                      value={generatedKeys.publicPem}
                      rows={6}
                      className="border-border bg-secondary/30 text-foreground w-full resize-none rounded-lg border p-3 font-mono text-[10px] leading-tight focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                        JWK Format (JSON)
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-border bg-secondary/50 text-muted-foreground h-7 w-7 shrink-0 p-0 hover:text-white"
                        onClick={() => handleCopy(generatedKeys.publicJwk, 'pubJwk')}
                      >
                        {copiedKey === 'pubJwk' ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    <textarea
                      readOnly
                      value={generatedKeys.publicJwk}
                      rows={6}
                      className="border-border bg-secondary/20 hover:bg-secondary/35 text-foreground/90 w-full resize-none rounded-lg border p-3 font-mono text-[10px] leading-tight transition-all focus:ring-1 focus:ring-blue-500/30 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="convert" className="mt-4 flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
              <h3 className="text-foreground flex items-center gap-1.5 border-b pb-2 text-sm font-bold">
                <FileText className="h-4 w-4 text-emerald-500" />
                Input Key Source
              </h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Paste any PEM format key (containing standard headers like BEGIN PRIVATE KEY/BEGIN
                PUBLIC KEY) or a raw JSON Web Key (JWK) object to automatically convert it.
              </p>
              <textarea
                value={convertInput}
                onChange={(e) => setConvertInput(e.target.value)}
                rows={12}
                placeholder="Paste PEM Key or JWK JSON object here..."
                className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-ring w-full resize-none rounded-lg border p-3 font-mono text-xs focus:ring-1 focus:outline-none"
              />
              <Button
                onClick={() => {
                  void handleConvert()
                }}
                disabled={!convertInput.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-full gap-2 transition-all duration-200"
              >
                <RefreshCw className="h-4 w-4" />
                Analyze &amp; Convert Key Format
              </Button>
            </div>

            <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
              <h3 className="text-foreground flex items-center gap-1.5 border-b pb-2 text-sm font-bold">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                Conversion Output
              </h3>

              {convertResult ? (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-secondary/40 border-border rounded-lg border p-2">
                      <span className="text-muted-foreground block text-[9px] tracking-wider uppercase">
                        Key Type
                      </span>
                      <span className="text-foreground mt-0.5 block font-semibold">
                        {convertResult.type}
                      </span>
                    </div>
                    <div className="bg-secondary/40 border-border rounded-lg border p-2">
                      <span className="text-muted-foreground block text-[9px] tracking-wider uppercase">
                        Algorithm
                      </span>
                      <span className="text-foreground mt-0.5 block font-semibold">
                        {convertResult.algo}
                      </span>
                    </div>
                    <div className="bg-secondary/40 border-border rounded-lg border p-2">
                      <span className="text-muted-foreground block text-[9px] tracking-wider uppercase">
                        Parameters
                      </span>
                      <span className="text-foreground mt-0.5 block font-semibold">
                        {convertResult.details}
                      </span>
                    </div>
                  </div>

                  {convertResult.fingerprint && (
                    <div className="bg-secondary/30 border-border flex flex-col gap-1.5 rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                          SHA-256 Fingerprint
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="border-border bg-secondary/50 text-muted-foreground h-7 w-7 shrink-0 p-0 hover:text-white"
                          onClick={() => handleCopy(convertResult.fingerprint!, 'convFp')}
                        >
                          {copiedKey === 'convFp' ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                      <div className="font-mono text-xs leading-normal font-semibold break-all text-indigo-600 select-all dark:text-indigo-400">
                        {convertResult.fingerprint}
                      </div>
                    </div>
                  )}

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-foreground text-xs font-semibold">
                        {convertResult.label}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-border bg-secondary/50 text-muted-foreground h-7 w-7 shrink-0 p-0 hover:text-white"
                        onClick={() => handleCopy(convertResult.value, 'convRes')}
                      >
                        {copiedKey === 'convRes' ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    <textarea
                      readOnly
                      value={convertResult.value}
                      rows={10}
                      className="border-border bg-secondary/30 text-foreground w-full resize-none rounded-lg border p-3 font-mono text-[10px] leading-tight focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    {convertResult.type === 'Private Key' ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSignKeyInput(convertInput)
                          setActivePanel('sign')
                          toast.success('Loaded into Signer!')
                        }}
                        className="h-9 w-full border-emerald-500/30 bg-emerald-500/5 text-xs font-bold text-emerald-500 transition-all duration-200 hover:bg-emerald-500/10 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-300"
                      >
                        Load Into Signer
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setVerifyKeyInput(convertInput)
                          setActivePanel('verify')
                          toast.success('Loaded into Verifier!')
                        }}
                        className="h-9 w-full border-blue-500/30 bg-blue-500/5 text-xs font-bold text-blue-500 transition-all duration-200 hover:bg-blue-500/10 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Load Into Verifier
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                  <div className="bg-secondary/40 text-muted-foreground mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed">
                    <FileText className="h-6 w-6 animate-pulse" />
                  </div>
                  <h4 className="text-foreground text-sm font-semibold">Awaiting Key Input</h4>
                  <p className="text-muted-foreground mt-1 max-w-xs text-xs leading-relaxed">
                    Paste a private or public key on the left pane and press analyze to perform
                    conversion.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="sign" className="mt-4 flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
              <h3 className="text-foreground flex items-center gap-1.5 border-b pb-2 text-sm font-bold">
                <Lock className="h-4 w-4 text-emerald-500" />
                Sign Message Flow
              </h3>

              <div className="flex flex-col gap-3">
                <div>
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Message Payload to Sign
                  </Label>
                  <textarea
                    value={signMessageText}
                    onChange={(e) => setSignMessageText(e.target.value)}
                    rows={4}
                    placeholder="Enter plain text message to sign..."
                    className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-ring mt-1.5 w-full resize-none rounded-lg border p-3 text-xs focus:ring-1 focus:outline-none"
                  />
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Private Key (PEM or JWK)
                  </Label>
                  <textarea
                    value={signKeyInput}
                    onChange={(e) => setSignKeyInput(e.target.value)}
                    rows={6}
                    placeholder="Paste private key here..."
                    className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-ring mt-1.5 w-full resize-none rounded-lg border p-3 font-mono text-[10px] leading-tight focus:ring-1 focus:outline-none"
                  />
                </div>

                <Button
                  onClick={() => {
                    void handleSign()
                  }}
                  disabled={!signMessageText || !signKeyInput}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-full gap-2 transition-all duration-200"
                >
                  <Shield className="h-4 w-4" />
                  Generate Digital Signature
                </Button>
              </div>
            </div>

            <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
              <h3 className="text-foreground flex items-center gap-1.5 border-b pb-2 text-sm font-bold">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                Signature Outputs
              </h3>

              {signatureHex || signatureBase64 ? (
                <div className="flex flex-col gap-4">
                  <div className="bg-secondary/40 border-border flex items-center justify-between rounded-lg border px-3 py-2 text-xs">
                    <span className="text-muted-foreground">Signature Details:</span>
                    <span className="text-foreground font-mono font-bold">
                      {signedAlgo} ({sigLength} bytes / {sigLength * 8} bits)
                    </span>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                        HEX Raw Format
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-border bg-secondary/50 text-muted-foreground h-7 w-7 shrink-0 p-0 hover:text-white"
                        onClick={() => handleCopy(signatureHex, 'sigHex')}
                      >
                        {copiedKey === 'sigHex' ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    <textarea
                      readOnly
                      value={signatureHex}
                      rows={4}
                      className="border-border bg-secondary/30 text-foreground w-full resize-none rounded-lg border p-3 font-mono text-[10px] leading-normal focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
                        Base64 Encoded Format
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-border bg-secondary/50 text-muted-foreground h-7 w-7 shrink-0 p-0 hover:text-white"
                        onClick={() => handleCopy(signatureBase64, 'sigB64')}
                      >
                        {copiedKey === 'sigB64' ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    <textarea
                      readOnly
                      value={signatureBase64}
                      rows={4}
                      className="border-border bg-secondary/30 text-foreground w-full resize-none rounded-lg border p-3 font-mono text-[10px] leading-normal focus:outline-none"
                    />
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setVerifyMessageText(signMessageText)
                      setVerifySignatureText(signatureBase64)
                      if (generatedKeys) {
                        setVerifyKeyInput(generatedKeys.publicPem)
                      }
                      setActivePanel('verify')
                      setVerificationResult(null)
                      toast.success('Signature payload copied to Verifier!')
                    }}
                    className="h-9 w-full gap-1 border-blue-500/30 bg-blue-500/5 text-xs font-bold text-blue-500 transition-all duration-200 hover:bg-blue-500/10 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Load into Verifier Component
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                  <div className="bg-secondary/40 text-muted-foreground mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed">
                    <Lock className="h-6 w-6 animate-pulse" />
                  </div>
                  <h4 className="text-foreground text-sm font-semibold">No Signature Active</h4>
                  <p className="text-muted-foreground mt-1 max-w-xs text-xs leading-relaxed">
                    Provide message payload and private key to sign on the left pane to produce
                    verifiable signature.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="verify" className="mt-4 flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
              <h3 className="text-foreground flex items-center gap-1.5 border-b pb-2 text-sm font-bold">
                <Unlock className="h-4 w-4 text-blue-500" />
                Signature Verification Console
              </h3>

              <div className="flex flex-col gap-3">
                <div>
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Original Message Payload
                  </Label>
                  <textarea
                    value={verifyMessageText}
                    onChange={(e) => setVerifyMessageText(e.target.value)}
                    rows={3}
                    placeholder="Enter original plain text message..."
                    className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-ring mt-1.5 w-full resize-none rounded-lg border p-3 text-xs focus:ring-1 focus:outline-none"
                  />
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Signature String (HEX or Base64)
                  </Label>
                  <textarea
                    value={verifySignatureText}
                    onChange={(e) => setVerifySignatureText(e.target.value)}
                    rows={3}
                    placeholder="Paste HEX or Base64 signature here..."
                    className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-ring mt-1.5 w-full resize-none rounded-lg border p-3 font-mono text-xs focus:ring-1 focus:outline-none"
                  />
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs font-semibold">
                    Public Key (PEM or JWK)
                  </Label>
                  <textarea
                    value={verifyKeyInput}
                    onChange={(e) => setVerifyKeyInput(e.target.value)}
                    rows={5}
                    placeholder="Paste corresponding public key here..."
                    className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-ring mt-1.5 w-full resize-none rounded-lg border p-3 font-mono text-[10px] leading-tight focus:ring-1 focus:outline-none"
                  />
                </div>

                <Button
                  onClick={() => {
                    void handleVerify()
                  }}
                  disabled={!verifyMessageText || !verifyKeyInput || !verifySignatureText}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 w-full gap-2 transition-all duration-200"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Perform Cryptographic Verification
                </Button>
              </div>
            </div>

            <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-5 shadow-sm">
              <h3 className="text-foreground flex items-center gap-1.5 border-b pb-2 text-sm font-bold">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                Verification Status
              </h3>

              {verificationResult !== null ? (
                <div className="flex flex-1 flex-col items-center justify-center p-8">
                  {verificationResult ? (
                    <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-green-500/20 bg-green-500/5 p-6 text-center text-green-600 dark:text-green-500">
                      <div className="rounded-full bg-green-500/10 p-3">
                        <Check className="h-10 w-10 text-green-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">Verification Successful</h4>
                        <p className="text-foreground/80 mt-1.5 text-xs leading-relaxed">
                          The cryptographic signature is VALID. The message contents are authentic
                          and have not been altered or tampered with since creation.
                        </p>
                      </div>
                      <div className="w-full space-y-1 rounded-lg border border-green-500/20 bg-green-500/10 p-2.5 text-left font-mono text-[10px] text-green-700 dark:text-green-400">
                        <div>Algorithm: {verifiedAlgo}</div>
                        <div>Key Context: Cryptographic {verifiedKeyType} key verified</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex w-full max-w-sm flex-col items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center text-red-600 dark:text-red-500">
                      <div className="rounded-full bg-red-500/10 p-3">
                        <X className="h-10 w-10 text-red-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">Verification Failed</h4>
                        <p className="text-foreground/80 mt-1.5 text-xs leading-relaxed">
                          The cryptographic signature is INVALID. The public key did not match the
                          signature, or the message contents have been tampered with.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                  <div className="bg-secondary/40 text-muted-foreground mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed">
                    <ShieldCheck className="h-6 w-6 animate-pulse" />
                  </div>
                  <h4 className="text-foreground text-sm font-semibold">Verification Pending</h4>
                  <p className="text-muted-foreground mt-1 max-w-xs text-xs leading-relaxed">
                    Provide original message payload, digital signature, and matching public key on
                    the left to verify authenticity.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </ToolLayout>
  )
}
