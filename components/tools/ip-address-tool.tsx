'use client'

import { useEffect, useState } from 'react'
import { Globe, MapPin, Network, RefreshCw, Copy, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToolLayout } from '@/components/tool-layout'
import { getIpInfo } from '@/app/actions/ip'

interface IpData {
  ip: string
  country: string
  region: string
  city: string
  latitude: string
  longitude: string
  continent: string
}

export default function IpAddressTool() {
  const [data, setData] = useState<IpData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const fetchIp = async () => {
    setLoading(true)
    try {
      const info = await getIpInfo()
      setData(info)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchIp()
  }, [])

  const handleCopy = (text: string) => {
    void navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <ToolLayout
      title="IP Address & Geolocation"
      description="View your public IP address and network geolocation information"
      icon={Globe}
    >
      <div className="flex flex-col gap-6">
        <div className="border-border bg-secondary/30 relative flex flex-col items-center justify-center rounded-2xl border p-8 text-center md:p-12">
          <Network className="text-primary mb-4 h-12 w-12 opacity-80" />
          <h3 className="text-muted-foreground mb-2 text-sm font-medium tracking-wider uppercase">
            Your IP Address
          </h3>
          {loading ? (
            <div className="bg-secondary/50 h-10 w-48 animate-pulse rounded-lg"></div>
          ) : (
            <p className="text-foreground font-mono text-4xl font-bold tracking-tight md:text-5xl">
              {data?.ip || 'Unknown'}
            </p>
          )}

          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleCopy(data?.ip || '')}
              disabled={loading || !data?.ip || data?.ip === 'Unknown IP'}
              className="border-border bg-secondary/50 text-muted-foreground flex h-9 items-center justify-center gap-1.5 p-0 hover:text-white sm:w-auto sm:px-3"
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                void fetchIp()
              }}
              disabled={loading}
              className="border-border bg-secondary/50 text-muted-foreground hover:text-white"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="border-border bg-secondary/30 rounded-2xl border p-6">
          <div className="mb-6 flex items-center gap-2">
            <MapPin className="text-primary h-5 w-5" />
            <span className="text-foreground text-lg font-semibold">Geolocation Details</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <InfoCard title="Country" value={data?.country} loading={loading} />
            <InfoCard title="Region" value={data?.region} loading={loading} />
            <InfoCard title="City" value={data?.city} loading={loading} />
            <InfoCard title="Latitude" value={data?.latitude} loading={loading} />
            <InfoCard title="Longitude" value={data?.longitude} loading={loading} />
            <InfoCard title="Continent" value={data?.continent} loading={loading} />
          </div>
        </div>
      </div>
    </ToolLayout>
  )
}

function InfoCard({ title, value, loading }: { title: string; value?: string; loading: boolean }) {
  const displayValue = value && value !== 'Unknown' && value.trim() !== '' ? value : 'N/A'

  return (
    <div className="border-border bg-secondary/50 flex flex-col justify-center rounded-xl border p-4">
      <span className="text-muted-foreground mb-1 text-xs font-medium tracking-wider uppercase">
        {title}
      </span>
      {loading ? (
        <div className="bg-secondary h-6 w-24 animate-pulse rounded"></div>
      ) : (
        <span className="text-foreground font-mono text-sm">{displayValue}</span>
      )}
    </div>
  )
}
