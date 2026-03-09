'use client'

import { useState, useCallback } from 'react'
import { useCopyToClipboard } from '@/hooks/use-copy'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Copy, CheckCircle2, RefreshCw, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react'
import bcrypt from 'bcryptjs'
import { argon2id } from 'hash-wasm'
import { ToolLayout } from '@/components/tool-layout'
import { tools } from '@/lib/tools'

function randomHex(bytes: number): string {
  const buf = crypto.getRandomValues(new Uint8Array(bytes))
  return Array.from(buf)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = hex.match(/.{1,2}/g)?.map((b) => parseInt(b, 16)) ?? []
  return new Uint8Array(bytes)
}

function bufferToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function estimateCrackTime(algo: string, params: Record<string, number>): string {
  let costFactor = 1
  const guessesPerSec = 10_000_000_000

  if (algo === 'pbkdf2') {
    costFactor = params.iterations ?? 100000
  } else if (algo === 'scrypt') {
    const N = params.N ?? 16384
    const r = params.r ?? 8
    const p = params.p ?? 1
    costFactor = N * r * p
  } else if (algo === 'bcrypt') {
    costFactor = Math.pow(2, params.rounds ?? 12)
  } else if (algo === 'argon2') {
    const t = params.timeCost ?? 3
    const m = params.memoryCost ?? 65536
    const p = params.parallelism ?? 4
    costFactor = t * m * p
  }

  const effectiveRate = guessesPerSec / costFactor
  const combinations = Math.pow(62, 8)
  const seconds = combinations / Math.max(effectiveRate, 1)

  if (seconds < 1) return '< 1 second'
  if (seconds < 60) return `~${Math.round(seconds)} seconds`
  if (seconds < 3600) return `~${Math.round(seconds / 60)} minutes`
  if (seconds < 86400) return `~${Math.round(seconds / 3600)} hours`
  if (seconds < 31536000) return `~${Math.round(seconds / 86400)} days`
  if (seconds < 31536000 * 1000) return `~${Math.round(seconds / 31536000)} years`
  if (seconds < 31536000 * 1e6) return `~${Math.round(seconds / 31536000 / 1000)}K years`
  if (seconds < 31536000 * 1e9) return `~${Math.round(seconds / 31536000 / 1e6)}M years`
  return 'centuries+'
}

function isWeak(algo: string, params: Record<string, number>): string | null {
  if (algo === 'pbkdf2' && (params.iterations ?? 0) < 100000) {
    return 'PBKDF2 iterations below 100,000 is not recommended for production.'
  }
  if (algo === 'bcrypt' && (params.rounds ?? 0) < 10) {
    return 'bcrypt cost factor below 10 is not recommended for production.'
  }
  if (algo === 'scrypt' && (params.N ?? 0) < 16384) {
    return 'scrypt N below 16384 is not recommended for production.'
  }
  if (algo === 'argon2' && (params.memoryCost ?? 0) < 19456) {
    return 'Argon2 memory cost below 19 MB is not recommended for production.'
  }
  return null
}

export default function PasswordHasher() {
  const tool = tools.find((t) => t.id === 'password-hasher')!
  const [algo, setAlgo] = useState('pbkdf2')
  const [password, setPassword] = useState('')
  const [salt, setSalt] = useState(() => randomHex(16))
  const [hashOutput, setHashOutput] = useState('')
  const [hashing, setHashing] = useState(false)
  const [error, setError] = useState('')

  const [pbkdf2Iterations, setPbkdf2Iterations] = useState(100000)
  const [pbkdf2Hash, setPbkdf2Hash] = useState<'SHA-256' | 'SHA-512'>('SHA-256')

  const [scryptN, setScryptN] = useState(16384)
  const [scryptR, setScryptR] = useState(8)
  const [scryptP, setScryptP] = useState(1)

  const [bcryptRounds, setBcryptRounds] = useState(12)

  const [argon2Time, setArgon2Time] = useState(3)
  const [argon2Mem, setArgon2Mem] = useState(65536)
  const [argon2Par, setArgon2Par] = useState(4)

  const [showPassword, setShowPassword] = useState(false)
  const [verifyResult, setVerifyResult] = useState('')

  const [copied, setCopied] = useState(false)
  const copyToClipboard = useCopyToClipboard()

  const copy = useCallback(
    (text: string) => {
      void copyToClipboard(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    },
    [copyToClipboard],
  )

  const regenerateSalt = useCallback(() => {
    setSalt(randomHex(16))
  }, [])

  const currentParams = useCallback((): Record<string, number> => {
    switch (algo) {
      case 'pbkdf2':
        return { iterations: pbkdf2Iterations }
      case 'scrypt':
        return { N: scryptN, r: scryptR, p: scryptP }
      case 'bcrypt':
        return { rounds: bcryptRounds }
      case 'argon2':
        return { timeCost: argon2Time, memoryCost: argon2Mem, parallelism: argon2Par }
      default:
        return {}
    }
  }, [
    algo,
    pbkdf2Iterations,
    scryptN,
    scryptR,
    scryptP,
    bcryptRounds,
    argon2Time,
    argon2Mem,
    argon2Par,
  ])

  const handleHash = useCallback(async () => {
    if (!password) return
    setHashing(true)
    setError('')
    setHashOutput('')
    setVerifyResult('')

    try {
      if (algo === 'pbkdf2') {
        const enc = new TextEncoder()
        const keyMaterial = await crypto.subtle.importKey(
          'raw',
          enc.encode(password),
          'PBKDF2',
          false,
          ['deriveBits'],
        )
        const saltBuf = hexToBuffer(salt)
        const bits = await crypto.subtle.deriveBits(
          {
            name: 'PBKDF2',
            salt: saltBuf.buffer as ArrayBuffer,
            iterations: pbkdf2Iterations,
            hash: pbkdf2Hash,
          },
          keyMaterial,
          256,
        )
        setHashOutput(bufferToHex(bits))
      } else if (algo === 'scrypt') {
        const enc = new TextEncoder()
        const keyMaterial = await crypto.subtle.importKey(
          'raw',
          enc.encode(password),
          'PBKDF2',
          false,
          ['deriveBits'],
        )
        const saltBuf = hexToBuffer(salt)
        const mappedIterations = Math.min(scryptN * scryptR * scryptP, 5000000)
        const bits = await crypto.subtle.deriveBits(
          {
            name: 'PBKDF2',
            salt: saltBuf.buffer as ArrayBuffer,
            iterations: mappedIterations,
            hash: 'SHA-256',
          },
          keyMaterial,
          256,
        )
        setHashOutput(
          `$scrypt$N=${scryptN}$r=${scryptR}$p=${scryptP}$${bufferToHex(saltBuf.buffer as ArrayBuffer)}$${bufferToHex(bits)}`,
        )
      } else if (algo === 'bcrypt') {
        const bcryptSalt = bcrypt.genSaltSync(bcryptRounds)
        const hash = bcrypt.hashSync(password, bcryptSalt)
        setHashOutput(hash)
      } else if (algo === 'argon2') {
        const result = await argon2id({
          password: password,
          salt: salt,
          iterations: argon2Time,
          memorySize: argon2Mem,
          parallelism: argon2Par,
          hashLength: 32,
          outputType: 'encoded',
        })
        setHashOutput(result)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hashing failed')
    } finally {
      setHashing(false)
    }
  }, [
    password,
    salt,
    algo,
    pbkdf2Iterations,
    pbkdf2Hash,
    scryptN,
    scryptR,
    scryptP,
    bcryptRounds,
    argon2Time,
    argon2Mem,
    argon2Par,
  ])

  const handleVerifyMatch = useCallback(async () => {
    if (algo === 'bcrypt' && hashOutput) {
      const isValid = bcrypt.compareSync(password, hashOutput)
      setVerifyResult(`Verification: ${isValid ? 'MATCH (Valid)' : 'NO MATCH (Invalid)'}`)
    } else if (algo === 'argon2' && hashOutput) {
      try {
        const verifyHash = await argon2id({
          password: password,
          salt: salt,
          iterations: argon2Time,
          memorySize: argon2Mem,
          parallelism: argon2Par,
          hashLength: 32,
          outputType: 'encoded',
        })

        if (verifyHash === hashOutput) {
          setVerifyResult('Verification: MATCH (Valid)')
        } else {
          setVerifyResult('Verification: NO MATCH (Invalid)')
        }
      } catch (e) {
        setVerifyResult(`Verification Error: ${e instanceof Error ? e.message : 'Failed'}`)
      }
    } else {
      setVerifyResult('Verification via browser only available for bcrypt & argon2id here.')
    }
  }, [algo, hashOutput, password, salt, argon2Time, argon2Mem, argon2Par])

  const crackTime = estimateCrackTime(algo, currentParams())
  const weakWarning = isWeak(algo, currentParams())

  return (
    <ToolLayout title={tool.name} description={tool.description} icon={tool.icon}>
      <div className="space-y-6">
        <Tabs value={algo} onValueChange={setAlgo}>
          <TabsList className="bg-secondary grid w-full grid-cols-4">
            <TabsTrigger value="pbkdf2" className="font-mono text-xs">
              PBKDF2
            </TabsTrigger>
            <TabsTrigger value="bcrypt" className="font-mono text-xs">
              bcrypt
            </TabsTrigger>
            <TabsTrigger value="argon2" className="font-mono text-xs">
              Argon2id
            </TabsTrigger>
            <TabsTrigger value="scrypt" className="font-mono text-xs">
              scrypt
            </TabsTrigger>
          </TabsList>

          <div className="mt-5 space-y-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-medium">Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password to hash..."
                  className="bg-secondary pr-20 font-mono text-sm"
                />
                <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-2">
                  <Label className="text-muted-foreground text-[10px]">Show</Label>
                  <Switch
                    checked={showPassword}
                    onCheckedChange={setShowPassword}
                    className="scale-75"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs font-medium">
                Salt (hex){algo === 'bcrypt' && ' — bcrypt generates its own salt'}
              </Label>
              <div className="flex gap-2">
                <Input
                  value={salt}
                  onChange={(e) => setSalt(e.target.value)}
                  className="bg-secondary font-mono text-xs"
                  disabled={algo === 'bcrypt'}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={regenerateSalt}
                  disabled={algo === 'bcrypt'}
                  className="text-muted-foreground dark:hover:text-foreground hover:text-white"
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  New
                </Button>
              </div>
            </div>

            <TabsContent value="pbkdf2" className="mt-0 space-y-4">
              <div className="border-border bg-secondary/50 space-y-4 rounded-lg border p-4">
                <h4 className="text-foreground text-xs font-semibold">PBKDF2 Parameters</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground text-xs">Iterations</Label>
                    <span className="text-primary font-mono text-xs">
                      {pbkdf2Iterations.toLocaleString()}
                    </span>
                  </div>
                  <Slider
                    value={[pbkdf2Iterations]}
                    onValueChange={([v]) => setPbkdf2Iterations(v)}
                    min={1000}
                    max={1000000}
                    step={1000}
                  />
                  <p className="text-muted-foreground text-[10px]">Recommended: 100,000+</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs">Hash Function</Label>
                  <Select
                    value={pbkdf2Hash}
                    onValueChange={(v) => setPbkdf2Hash(v as 'SHA-256' | 'SHA-512')}
                  >
                    <SelectTrigger className="bg-secondary font-mono text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SHA-256">SHA-256</SelectItem>
                      <SelectItem value="SHA-512">SHA-512</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bcrypt" className="mt-0 space-y-4">
              <div className="border-border bg-secondary/50 space-y-4 rounded-lg border p-4">
                <h4 className="text-foreground text-xs font-semibold">bcrypt Parameters</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground text-xs">Cost Factor (rounds)</Label>
                    <span className="text-primary font-mono text-xs">{bcryptRounds}</span>
                  </div>
                  <Slider
                    value={[bcryptRounds]}
                    onValueChange={([v]) => setBcryptRounds(v)}
                    min={4}
                    max={20}
                    step={1}
                  />
                  <p className="text-muted-foreground text-[10px]">
                    {'2^'}
                    {bcryptRounds}
                    {' = '}
                    {Math.pow(2, bcryptRounds).toLocaleString()}
                    {' iterations. Recommended: 12+'}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="argon2" className="mt-0 space-y-4">
              <div className="border-border bg-secondary/50 space-y-4 rounded-lg border p-4">
                <h4 className="text-foreground text-xs font-semibold">Argon2id Parameters</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground text-xs">Time Cost</Label>
                    <span className="text-primary font-mono text-xs">{argon2Time}</span>
                  </div>
                  <Slider
                    value={[argon2Time]}
                    onValueChange={([v]) => setArgon2Time(v)}
                    min={1}
                    max={16}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground text-xs">Memory Cost (KB)</Label>
                    <span className="text-primary font-mono text-xs">
                      {argon2Mem.toLocaleString()} KB
                    </span>
                  </div>
                  <Slider
                    value={[argon2Mem]}
                    onValueChange={([v]) => setArgon2Mem(v)}
                    min={1024}
                    max={262144}
                    step={1024}
                  />
                  <p className="text-muted-foreground text-[10px]">
                    = {(argon2Mem / 1024).toFixed(0)} MB. Recommended: 19 MB+
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground text-xs">Parallelism</Label>
                    <span className="text-primary font-mono text-xs">{argon2Par}</span>
                  </div>
                  <Slider
                    value={[argon2Par]}
                    onValueChange={([v]) => setArgon2Par(v)}
                    min={1}
                    max={16}
                    step={1}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="scrypt" className="mt-0 space-y-4">
              <div className="border-border bg-secondary/50 space-y-4 rounded-lg border p-4">
                <h4 className="text-foreground text-xs font-semibold">scrypt Parameters</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-muted-foreground text-xs">N (CPU/Memory Cost)</Label>
                    <span className="text-primary font-mono text-xs">
                      {scryptN.toLocaleString()}
                    </span>
                  </div>
                  <Slider
                    value={[Math.log2(scryptN)]}
                    onValueChange={([v]) => setScryptN(Math.pow(2, v))}
                    min={10}
                    max={20}
                    step={1}
                  />
                  <p className="text-muted-foreground text-[10px]">
                    {'2^'}
                    {Math.log2(scryptN)}
                    {'. Recommended: 16384 (2^14)+'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-muted-foreground text-xs">r (Block Size)</Label>
                      <span className="text-primary font-mono text-xs">{scryptR}</span>
                    </div>
                    <Slider
                      value={[scryptR]}
                      onValueChange={([v]) => setScryptR(v)}
                      min={1}
                      max={32}
                      step={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-muted-foreground text-xs">p (Parallelism)</Label>
                      <span className="text-primary font-mono text-xs">{scryptP}</span>
                    </div>
                    <Slider
                      value={[scryptP]}
                      onValueChange={([v]) => setScryptP(v)}
                      min={1}
                      max={16}
                      step={1}
                    />
                  </div>
                </div>
                <p className="text-muted-foreground text-[10px] italic">
                  Note: Browser SubtleCrypto does not natively support scrypt. This tool uses PBKDF2
                  with mapped cost (N*r*p iterations) as a client-side approximation. For true
                  scrypt, use Node.js.
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <div className="border-border bg-secondary/50 flex flex-col gap-3 rounded-lg border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-primary h-4 w-4" />
            <span className="text-muted-foreground text-xs">
              Est. crack time (8-char alphanumeric):
            </span>
            <span className="text-primary font-mono text-xs font-semibold">{crackTime}</span>
          </div>
          {weakWarning && (
            <div className="flex items-center gap-1.5 text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-[11px] leading-tight">{weakWarning}</span>
            </div>
          )}
        </div>

        <Button
          onClick={() => {
            void handleHash()
          }}
          className="w-full"
          disabled={!password || hashing}
        >
          {hashing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Hashing...
            </>
          ) : (
            'Hash Password'
          )}
        </Button>

        {error && (
          <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-lg border px-4 py-3 text-xs">
            {error}
          </div>
        )}

        {hashOutput && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-muted-foreground text-xs font-medium">Hash Output</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copy(hashOutput)}
                className="border-border bg-secondary/50 text-muted-foreground flex h-9 items-center justify-center gap-1.5 p-0 hover:text-white sm:w-auto sm:px-3"
              >
                {copied ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
              </Button>
            </div>
            <div className="border-border bg-secondary rounded-lg border p-4">
              <pre className="text-foreground font-mono text-xs leading-relaxed break-all whitespace-pre-wrap">
                {hashOutput}
              </pre>
            </div>
            <p className="text-muted-foreground text-[10px]">
              Algorithm: <span className="text-foreground font-mono">{algo.toUpperCase()}</span>
              {algo !== 'bcrypt' && (
                <>
                  {' '}
                  | Salt: <span className="text-foreground font-mono">{salt.slice(0, 16)}...</span>
                </>
              )}
            </p>

            <div className="border-border bg-secondary/30 mt-4 space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <Label className="text-foreground text-xs font-semibold">Verify Hash</Label>
              </div>
              <div className="text-muted-foreground mb-2 text-xs">
                Verify if the current password matches this generated hash.
              </div>
              <Button
                variant="outline"
                size="sm"
                className="text-muted-foreground dark:hover:text-foreground h-8 w-full text-xs hover:text-white"
                onClick={() => {
                  void handleVerifyMatch()
                }}
              >
                Verify Match
              </Button>
              {verifyResult && (
                <div
                  className={`rounded p-2 font-mono text-xs ${
                    verifyResult.includes('MATCH (Valid)')
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : verifyResult.includes('NO MATCH')
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {verifyResult}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </ToolLayout>
  )
}
