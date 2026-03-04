'use client'

import { useState, useCallback, useEffect } from 'react'
import { useCopyToClipboard } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Copy, Check, ShieldCheck, AlertCircle } from 'lucide-react'

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

export default function HmacGenerator() {
  const [message, setMessage] = useState('')
  const [secret, setSecret] = useState('')
  const [algo, setAlgo] = useState('SHA-256')
  const [showSecret, setShowSecret] = useState(false)

  const [hexDigest, setHexDigest] = useState('')
  const [base64Digest, setBase64Digest] = useState('')
  const [verifySig, setVerifySig] = useState('')

  const [copiedHex, setCopiedHex] = useState(false)
  const [copiedB64, setCopiedB64] = useState(false)
  const copyToClipboard = useCopyToClipboard()

  useEffect(() => {
    const generateHmac = async () => {
      if (!message || !secret) {
        setHexDigest('')
        setBase64Digest('')
        return
      }
      try {
        const enc = new TextEncoder()
        const keyMaterial = await crypto.subtle.importKey(
          'raw',
          enc.encode(secret),
          { name: 'HMAC', hash: algo },
          false,
          ['sign'],
        )
        const signature = await crypto.subtle.sign('HMAC', keyMaterial, enc.encode(message))
        setHexDigest(bufferToHex(signature))
        setBase64Digest(bufferToBase64(signature))
      } catch {
        setHexDigest('')
        setBase64Digest('')
      }
    }
    void generateHmac()
  }, [message, secret, algo])

  const copyHex = useCallback(() => {
    if (!hexDigest) return
    void copyToClipboard(hexDigest)
    setCopiedHex(true)
    setTimeout(() => setCopiedHex(false), 2000)
  }, [hexDigest, copyToClipboard])

  const copyB64 = useCallback(() => {
    if (!base64Digest) return
    void copyToClipboard(base64Digest)
    setCopiedB64(true)
    setTimeout(() => setCopiedB64(false), 2000)
  }, [base64Digest, copyToClipboard])

  const isVerified = verifySig !== '' && (verifySig === hexDigest || verifySig === base64Digest)

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-medium">Message</Label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="border-border bg-secondary text-foreground placeholder:text-muted-foreground focus:ring-ring h-32 w-full resize-none rounded-lg border p-3 font-mono text-xs leading-relaxed focus:ring-1 focus:outline-none"
              placeholder="Enter message to sign..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-medium">Secret Key</Label>
            <div className="relative">
              <Input
                type={showSecret ? 'text' : 'password'}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                placeholder="Enter secret key..."
                className="bg-secondary pr-20 font-mono text-sm"
              />
              <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-2">
                <Label className="text-muted-foreground text-[10px]">Show</Label>
                <Switch checked={showSecret} onCheckedChange={setShowSecret} className="scale-75" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs font-medium">Algorithm</Label>
            <Select value={algo} onValueChange={setAlgo}>
              <SelectTrigger className="bg-secondary font-mono text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SHA-256">HMAC-SHA256</SelectItem>
                <SelectItem value="SHA-384">HMAC-SHA384</SelectItem>
                <SelectItem value="SHA-512">HMAC-SHA512</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border-border bg-card space-y-4 rounded-lg border p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-xs font-medium">Hex Digest</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyHex}
                  disabled={!hexDigest}
                  className="text-muted-foreground dark:hover:text-foreground h-7 gap-1 text-xs hover:text-white"
                >
                  {copiedHex ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  Copy
                </Button>
              </div>
              <div className="border-border bg-secondary/50 min-h-[44px] rounded-md border p-3">
                <p className="text-foreground font-mono text-xs break-all">
                  {hexDigest || (
                    <span className="text-muted-foreground/50">waiting for input...</span>
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-xs font-medium">Base64 Digest</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyB64}
                  disabled={!base64Digest}
                  className="text-muted-foreground dark:hover:text-foreground h-7 gap-1 text-xs hover:text-white"
                >
                  {copiedB64 ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  Copy
                </Button>
              </div>
              <div className="border-border bg-secondary/50 min-h-[44px] rounded-md border p-3">
                <p className="text-foreground font-mono text-xs break-all">
                  {base64Digest || (
                    <span className="text-muted-foreground/50">waiting for input...</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="border-border bg-secondary/30 space-y-3 rounded-lg border p-4">
            <Label className="text-foreground flex items-center gap-2 text-xs font-semibold">
              <ShieldCheck className="text-primary h-4 w-4" />
              Webhook Signature Verification
            </Label>
            <p className="text-muted-foreground text-[11px] leading-relaxed">
              Paste a received signature to verify it against the currently generated HMAC.
            </p>
            <div className="space-y-2">
              <Input
                value={verifySig}
                onChange={(e) => setVerifySig(e.target.value)}
                placeholder="Paste signature here..."
                className="bg-background font-mono text-xs"
              />
              {verifySig && (
                <div
                  className={`flex items-center gap-2 rounded-md p-2 text-xs font-medium ${isVerified ? 'bg-emerald-500/15 text-emerald-500' : 'bg-destructive/15 text-destructive'}`}
                >
                  {isVerified ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Valid Signature
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3.5 w-3.5" /> Invalid Signature
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="border-border bg-card overflow-hidden rounded-lg border">
        <div className="bg-secondary/50 border-border border-b px-4 py-2">
          <Label className="text-foreground text-xs font-semibold">Usage Examples</Label>
        </div>
        <div className="divide-border grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="space-y-2 p-4">
            <Label className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
              Node.js
            </Label>
            <pre className="text-muted-foreground overflow-x-auto font-mono text-[10px] whitespace-pre-wrap">
              {`const crypto = require('crypto');
const hmac = crypto.createHmac(
  '${algo.toLowerCase().replace('-', '')}', 
  '${secret || 'secret'}'
);
hmac.update('${message || 'message'}');
console.log(hmac.digest('hex'));`}
            </pre>
          </div>
          <div className="space-y-2 p-4">
            <Label className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
              Python
            </Label>
            <pre className="text-muted-foreground overflow-x-auto font-mono text-[10px] whitespace-pre-wrap">
              {`import hmac
import hashlib

sig = hmac.new(
    b'${secret || 'secret'}',
    b'${message || 'message'}',
    hashlib.${algo.toLowerCase().replace('-', '')}
).hexdigest()
print(sig)`}
            </pre>
          </div>
          <div className="space-y-2 p-4">
            <Label className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
              PHP
            </Label>
            <pre className="text-muted-foreground overflow-x-auto font-mono text-[10px] whitespace-pre-wrap">
              {`$sig = hash_hmac(
    '${algo.toLowerCase().replace('-', '')}', 
    '${message || 'message'}', 
    '${secret || 'secret'}'
);
echo $sig;`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
