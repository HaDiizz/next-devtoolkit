'use client'

import { useState } from 'react'
import { Lock, Unlock, Eye, EyeOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ToolLayout, OutputArea } from '@/components/tool-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

async function deriveKey(
  secret: string,
  salt: Uint8Array,
  algo: 'AES-GCM' | 'AES-CBC' = 'AES-GCM',
): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, [
    'deriveKey',
  ])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt as BufferSource, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: algo, length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

function toHex(buf: ArrayBuffer | Uint8Array): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function fromHex(hex: string): Uint8Array {
  const bytes = hex.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? []
  return new Uint8Array(bytes)
}

type Algorithm = 'AES-GCM' | 'AES-CBC'

export default function EncryptionTool() {
  const [algorithm, setAlgorithm] = useState<Algorithm>('AES-GCM')
  const [secret, setSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [encryptInput, setEncryptInput] = useState('')
  const [encryptOutput, setEncryptOutput] = useState('')
  const [decryptInput, setDecryptInput] = useState('')
  const [decryptOutput, setDecryptOutput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const generateSecret = () => {
    const arr = new Uint8Array(32)
    crypto.getRandomValues(arr)
    setSecret(toHex(arr))
  }

  const encrypt = async () => {
    if (!secret) {
      setError('Secret key is required.')
      return
    }
    if (!encryptInput) {
      setError('Please enter text to encrypt.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const enc = new TextEncoder()
      const salt = crypto.getRandomValues(new Uint8Array(16))
      const iv = crypto.getRandomValues(new Uint8Array(algorithm === 'AES-GCM' ? 12 : 16))
      const key = await deriveKey(secret, salt, algorithm)

      const encrypted = await crypto.subtle.encrypt(
        algorithm === 'AES-GCM'
          ? { name: 'AES-GCM', iv: iv as BufferSource }
          : { name: 'AES-CBC', iv: iv as BufferSource },
        key,
        enc.encode(encryptInput),
      )

      // Format: algorithm:salt:iv:ciphertext (all hex)
      const output = `${algorithm}:${toHex(salt)}:${toHex(iv)}:${toHex(encrypted)}`
      setEncryptOutput(output)
    } catch (e) {
      setError(`Encryption failed: ${(e as Error).message}`)
    } finally {
      setLoading(false)
    }
  }

  const decrypt = async () => {
    if (!secret) {
      setError('Secret key is required.')
      return
    }
    if (!decryptInput) {
      setError('Please enter ciphertext to decrypt.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const parts = decryptInput.trim().split(':')
      if (parts.length !== 4) {
        throw new Error('Invalid ciphertext format. Expected: algorithm:salt:iv:ciphertext')
      }

      const [algo, saltHex, ivHex, ciphertextHex] = parts
      const salt = fromHex(saltHex)
      const iv = fromHex(ivHex)
      const ciphertext = fromHex(ciphertextHex)
      const dec = new TextDecoder()

      if (algo === 'AES-GCM') {
        const key = await deriveKey(secret, salt, 'AES-GCM')
        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: iv as BufferSource },
          key,
          ciphertext as BufferSource,
        )
        setDecryptOutput(dec.decode(decrypted))
      } else if (algo === 'AES-CBC') {
        const key = await deriveKey(secret, salt, 'AES-CBC')
        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-CBC', iv: iv as BufferSource },
          key,
          ciphertext as BufferSource,
        )
        setDecryptOutput(dec.decode(decrypted))
      } else {
        throw new Error(`Unsupported algorithm: ${algo}`)
      }
    } catch (e) {
      setError(`Decryption failed: ${(e as Error).message}`)
      setDecryptOutput('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ToolLayout
      title="Encryption / Decryption"
      description="Encrypt and decrypt text using AES-GCM or AES-CBC with a secret key (Web Crypto API)"
      icon={Lock}
    >
      {/* Secret key input */}
      <div className="border-border bg-secondary/30 flex flex-col gap-2 rounded-lg border p-4">
        <Label className="text-muted-foreground text-xs font-medium">Secret Key</Label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type={showSecret ? 'text' : 'password'}
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Enter or generate a secret key..."
              className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-ring w-full rounded-lg border px-4 py-2.5 pr-10 font-mono text-sm focus:ring-1 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="text-muted-foreground dark:hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 hover:text-white"
            >
              {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={generateSecret}
            className="border-border text-muted-foreground dark:hover:text-foreground gap-1.5 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Generate
          </Button>
        </div>
      </div>

      {/* Algorithm selector */}
      <div className="flex flex-col gap-2">
        <Label className="text-muted-foreground text-xs">Algorithm</Label>
        <div className="flex gap-2">
          {(['AES-GCM', 'AES-CBC'] as Algorithm[]).map((algo) => (
            <button
              key={algo}
              onClick={() => setAlgorithm(algo)}
              className={`rounded-lg border px-4 py-2 text-xs font-medium transition-colors ${
                algorithm === algo
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-secondary/50 text-muted-foreground dark:hover:text-foreground hover:text-white'
              }`}
            >
              {algo}
            </button>
          ))}
        </div>
        <p className="text-muted-foreground text-xs">
          {algorithm === 'AES-GCM'
            ? 'AES-GCM provides authenticated encryption (integrity + confidentiality). Recommended.'
            : 'AES-CBC provides confidentiality only. Use GCM when possible.'}
        </p>
      </div>

      {/* Encrypt / Decrypt tabs */}
      <Tabs defaultValue="encrypt">
        <TabsList className="bg-secondary">
          <TabsTrigger
            value="encrypt"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5"
          >
            <Lock className="h-3.5 w-3.5" />
            Encrypt
          </TabsTrigger>
          <TabsTrigger
            value="decrypt"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5"
          >
            <Unlock className="h-3.5 w-3.5" />
            Decrypt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="encrypt" className="mt-4">
          <div className="flex flex-col gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Plain Text</Label>
              <textarea
                value={encryptInput}
                onChange={(e) => setEncryptInput(e.target.value)}
                rows={5}
                placeholder="Enter text to encrypt..."
                className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-ring mt-1 w-full resize-none rounded-lg border px-4 py-3 text-sm focus:ring-1 focus:outline-none"
              />
            </div>
            <Button
              onClick={() => {
                void encrypt()
              }}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-fit gap-1.5"
            >
              <Lock className="h-4 w-4" />
              {loading ? 'Encrypting...' : 'Encrypt'}
            </Button>
            {encryptOutput && (
              <OutputArea label="Encrypted Output (hex)" value={encryptOutput} rows={5} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="decrypt" className="mt-4">
          <div className="flex flex-col gap-4">
            <div>
              <Label className="text-muted-foreground text-xs">Encrypted String</Label>
              <textarea
                value={decryptInput}
                onChange={(e) => setDecryptInput(e.target.value)}
                rows={5}
                placeholder="Paste encrypted string (algorithm:salt:iv:ciphertext)..."
                className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-ring mt-1 w-full resize-none rounded-lg border px-4 py-3 font-mono text-sm focus:ring-1 focus:outline-none"
              />
            </div>
            <Button
              onClick={() => {
                void decrypt()
              }}
              disabled={loading}
              className="bg-primary text-primary-foreground hover:bg-primary/90 w-fit gap-1.5"
            >
              <Unlock className="h-4 w-4" />
              {loading ? 'Decrypting...' : 'Decrypt'}
            </Button>
            {decryptOutput && <OutputArea label="Decrypted Text" value={decryptOutput} rows={5} />}
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
