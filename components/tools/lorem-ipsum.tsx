'use client'

import { useState, useCallback } from 'react'
import { Type } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ToolLayout, OutputArea } from '@/components/tool-layout'

const WORDS = [
  'lorem',
  'ipsum',
  'dolor',
  'sit',
  'amet',
  'consectetur',
  'adipiscing',
  'elit',
  'sed',
  'do',
  'eiusmod',
  'tempor',
  'incididunt',
  'ut',
  'labore',
  'et',
  'dolore',
  'magna',
  'aliqua',
  'ut',
  'enim',
  'ad',
  'minim',
  'veniam',
  'quis',
  'nostrud',
  'exercitation',
  'ullamco',
  'laboris',
  'nisi',
  'aliquip',
  'ex',
  'ea',
  'commodo',
  'consequat',
  'duis',
  'aute',
  'irure',
  'in',
  'reprehenderit',
  'voluptate',
  'velit',
  'esse',
  'cillum',
  'fugiat',
  'nulla',
  'pariatur',
  'excepteur',
  'sint',
  'occaecat',
  'cupidatat',
  'non',
  'proident',
  'sunt',
  'culpa',
  'qui',
  'officia',
  'deserunt',
  'mollit',
  'anim',
  'id',
  'est',
  'laborum',
  'cras',
  'justo',
  'odio',
  'dapibus',
  'ac',
  'facilisis',
  'egestas',
  'maecenas',
  'faucibus',
  'interdum',
  'posuere',
  'urna',
  'nec',
  'tincidunt',
  'praesent',
  'semper',
  'feugiat',
  'nibh',
]

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateWords(count: number): string {
  return Array.from({ length: count }, () => pick(WORDS)).join(' ')
}

function generateSentence(): string {
  const len = Math.floor(Math.random() * 10) + 5
  const words = generateWords(len)
  return words.charAt(0).toUpperCase() + words.slice(1) + '.'
}

function generateParagraph(): string {
  const sentences = Math.floor(Math.random() * 4) + 3
  return Array.from({ length: sentences }, generateSentence).join(' ')
}

type LoremType = 'paragraphs' | 'sentences' | 'words'

export default function LoremIpsumTool() {
  const [type, setType] = useState<LoremType>('paragraphs')
  const [count, setCount] = useState(3)
  const [output, setOutput] = useState('')

  const generate = useCallback(() => {
    switch (type) {
      case 'paragraphs':
        setOutput(Array.from({ length: count }, generateParagraph).join('\n\n'))
        break
      case 'sentences':
        setOutput(Array.from({ length: count }, generateSentence).join(' '))
        break
      case 'words':
        setOutput(generateWords(count))
        break
    }
  }, [type, count])

  return (
    <ToolLayout
      title="Lorem Ipsum Generator"
      description="Generate placeholder text in paragraphs, sentences, or words"
      icon={Type}
    >
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label className="text-muted-foreground text-xs">Type</Label>
          <div className="mt-1 flex gap-1.5">
            {(['paragraphs', 'sentences', 'words'] as LoremType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${type === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground dark:hover:text-foreground hover:text-white'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="w-28">
          <Label htmlFor="lorem-count" className="text-muted-foreground text-xs">
            Count
          </Label>
          <Input
            id="lorem-count"
            type="number"
            min={1}
            max={100}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(100, Number(e.target.value))))}
            className="bg-secondary border-border text-foreground mt-1"
          />
        </div>
        <Button
          onClick={generate}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Generate
        </Button>
      </div>

      {output && <OutputArea label="Generated Text" value={output} rows={12} />}
    </ToolLayout>
  )
}
