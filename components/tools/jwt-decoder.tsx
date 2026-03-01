'use client'

import { useState } from 'react'
import { KeyRound, AlertTriangle, Clock, ShieldCheck } from 'lucide-react'
import { ToolLayout, OutputArea } from '@/components/tool-layout'

function base64UrlDecode(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4
  const withPadding = pad ? padded + '='.repeat(4 - pad) : padded
  try {
    return atob(withPadding)
  } catch {
    return ''
  }
}

interface DecodedJwt {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
}

function decodeJwt(token: string): DecodedJwt | null {
  const parts = token.trim().split('.')
  if (parts.length !== 3) return null
  try {
    const header = JSON.parse(base64UrlDecode(parts[0]))
    const payload = JSON.parse(base64UrlDecode(parts[1]))
    return { header, payload, signature: parts[2] }
  } catch {
    return null
  }
}

function formatTimestamp(value: unknown): string {
  if (typeof value !== 'number') return String(value)
  const d = new Date(value * 1000)
  return `${d.toLocaleString()} (${d.toISOString()})`
}

const KNOWN_CLAIMS: Record<string, string> = {
  iss: 'Issuer',
  sub: 'Subject',
  aud: 'Audience',
  exp: 'Expiration Time',
  nbf: 'Not Before',
  iat: 'Issued At',
  jti: 'JWT ID',
  name: 'Full Name',
  email: 'Email',
  role: 'Role',
  scope: 'Scope',
  azp: 'Authorized Party',
  nonce: 'Nonce',
}

const TIME_CLAIMS = new Set(['exp', 'nbf', 'iat'])

export default function JwtDecoderTool() {
  const [input, setInput] = useState('')
  const decoded = input.trim() ? decodeJwt(input) : null
  const isExpired = decoded?.payload?.exp
    ? (decoded.payload.exp as number) * 1000 < Date.now()
    : false

  return (
    <ToolLayout
      title="JWT Decoder"
      description="Decode and inspect JSON Web Tokens (header, payload, and claims)"
      icon={KeyRound}
    >
      <div>
        <p className="text-muted-foreground mb-1.5 text-xs font-medium">Paste JWT Token</p>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
          rows={4}
          className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-ring w-full resize-none rounded-lg border px-4 py-3 font-mono text-sm break-all focus:ring-1 focus:outline-none"
        />
      </div>

      {input.trim() && !decoded && (
        <div className="border-destructive/30 bg-destructive/10 text-destructive flex items-center gap-2 rounded-lg border px-4 py-3 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Invalid JWT format. Must have 3 dot-separated base64url parts.
        </div>
      )}

      {decoded && (
        <div className="flex flex-col gap-4">
          {/* Status badges */}
          <div className="flex flex-wrap gap-2">
            <span className="bg-secondary text-foreground inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium">
              <span className="text-muted-foreground">Algorithm:</span>{' '}
              {String(decoded.header.alg || 'unknown')}
            </span>
            <span className="bg-secondary text-foreground inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium">
              <span className="text-muted-foreground">Type:</span>{' '}
              {String(decoded.header.typ || 'JWT')}
            </span>
            {typeof decoded.payload.exp === 'number' && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${
                  isExpired ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
                }`}
              >
                {isExpired ? (
                  <>
                    <AlertTriangle className="h-3 w-3" /> Expired
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-3 w-3" /> Valid
                  </>
                )}
              </span>
            )}
          </div>

          {/* Header */}
          <div className="border-border bg-card overflow-hidden rounded-lg border">
            <div className="border-border bg-secondary/30 flex items-center gap-2 border-b px-5 py-3">
              <span className="bg-primary/20 text-primary rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                Header
              </span>
            </div>
            <pre className="text-foreground overflow-x-auto px-5 py-4 font-mono text-sm">
              {JSON.stringify(decoded.header, null, 2)}
            </pre>
          </div>

          {/* Payload Claims */}
          <div className="border-border bg-card overflow-hidden rounded-lg border">
            <div className="border-border bg-secondary/30 flex items-center gap-2 border-b px-5 py-3">
              <span className="bg-primary/20 text-primary rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                Payload
              </span>
              <span className="text-muted-foreground text-xs">
                {Object.keys(decoded.payload).length} claims
              </span>
            </div>
            <div className="divide-border/50 divide-y">
              {Object.entries(decoded.payload).map(([key, value]) => (
                <div
                  key={key}
                  className="flex flex-col gap-1 px-5 py-3 sm:flex-row sm:items-start sm:gap-4"
                >
                  <div className="shrink-0 sm:w-40">
                    <code className="text-primary text-xs font-semibold">{key}</code>
                    {KNOWN_CLAIMS[key] && (
                      <p className="text-muted-foreground text-[11px]">{KNOWN_CLAIMS[key]}</p>
                    )}
                  </div>
                  <div className="text-foreground flex-1 font-mono text-xs break-all">
                    {TIME_CLAIMS.has(key) && typeof value === 'number' ? (
                      <div className="flex flex-col gap-0.5">
                        <span>{String(value)}</span>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(value)}
                        </span>
                      </div>
                    ) : typeof value === 'object' ? (
                      <pre className="whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
                    ) : (
                      String(value)
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signature */}
          <div className="border-border bg-card overflow-hidden rounded-lg border">
            <div className="border-border bg-secondary/30 flex items-center gap-2 border-b px-5 py-3">
              <span className="bg-primary/20 text-primary rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                Signature
              </span>
            </div>
            <p className="text-muted-foreground px-5 py-4 font-mono text-xs break-all">
              {decoded.signature}
            </p>
          </div>

          {/* Full raw output */}
          <OutputArea
            label="Full Decoded JSON"
            value={JSON.stringify({ header: decoded.header, payload: decoded.payload }, null, 2)}
            rows={10}
          />
        </div>
      )}
    </ToolLayout>
  )
}
