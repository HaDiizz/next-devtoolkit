'use client'

import { useState } from 'react'
import { FileCode } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ToolLayout, OutputArea } from '@/components/tool-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function UrlEncoderTool() {
  const [encInput, setEncInput] = useState('')
  const [encOutput, setEncOutput] = useState('')
  const [decInput, setDecInput] = useState('')
  const [decOutput, setDecOutput] = useState('')
  const [error, setError] = useState('')

  const encode = () => {
    try {
      setEncOutput(encodeURIComponent(encInput))
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  const decode = () => {
    try {
      setDecOutput(decodeURIComponent(decInput))
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <ToolLayout
      title="URL Encoder/Decoder"
      description="Encode and decode URL components and query strings"
      icon={FileCode}
    >
      <Tabs defaultValue="encode">
        <TabsList className="bg-secondary">
          <TabsTrigger
            value="encode"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Encode
          </TabsTrigger>
          <TabsTrigger
            value="decode"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Decode
          </TabsTrigger>
        </TabsList>

        <TabsContent value="encode" className="mt-4 flex flex-col gap-4">
          <div>
            <Label className="text-muted-foreground text-xs">Plain URL / String</Label>
            <textarea
              value={encInput}
              onChange={(e) => setEncInput(e.target.value)}
              rows={4}
              placeholder="https://example.com/search?q=hello world&lang=en"
              className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-ring mt-1 w-full resize-none rounded-lg border px-4 py-3 text-sm focus:ring-1 focus:outline-none"
            />
          </div>
          <Button
            onClick={encode}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-fit"
          >
            Encode
          </Button>
          {encOutput && <OutputArea label="Encoded" value={encOutput} rows={4} />}
        </TabsContent>

        <TabsContent value="decode" className="mt-4 flex flex-col gap-4">
          <div>
            <Label className="text-muted-foreground text-xs">Encoded URL / String</Label>
            <textarea
              value={decInput}
              onChange={(e) => setDecInput(e.target.value)}
              rows={4}
              placeholder="https%3A%2F%2Fexample.com"
              className="border-border bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:ring-ring mt-1 w-full resize-none rounded-lg border px-4 py-3 font-mono text-sm focus:ring-1 focus:outline-none"
            />
          </div>
          <Button
            onClick={decode}
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-fit"
          >
            Decode
          </Button>
          {decOutput && <OutputArea label="Decoded" value={decOutput} rows={4} />}
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
