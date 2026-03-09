'use client'

import { useState, useCallback, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link as LinkIcon,
  Code,
  Heading1,
  Heading2,
  Table,
  CheckSquare,
  Copy,
  Download,
  Eye,
  Edit3,
  Undo2,
  Trash2,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ToolLayout } from '@/components/tool-layout'
import { tools } from '@/lib/tools'
import { useCopyToClipboard } from '@/hooks/use-copy'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const DEFAULT_MARKDOWN = `# Markdown Preview

Welcome to the **DevToolkit** Markdown Editor!

## Features
- [x] Live Preview
- [x] GitHub Flavored Markdown (GFM)
- [x] Table support
- [x] HTML support

| Component | Status |
| :--- | :--- |
| Editor | Active |
| Preview | Live |

### Code Example
\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

> This is a blockquote.

[Visit GitHub](https://github.com)
`

export default function MarkdownPreview() {
  const tool = tools.find((t) => t.id === 'markdown-preview')!
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const copyToClipboard = useCopyToClipboard()
  const [copied, setCopied] = useState(false)

  const copy = useCallback(
    (text: string) => {
      void copyToClipboard(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    },
    [copyToClipboard],
  )

  const insertText = useCallback(
    (before: string, after: string = '') => {
      const textarea = textareaRef.current
      if (!textarea) return

      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const selectedText = markdown.substring(start, end)
      const newText =
        markdown.substring(0, start) + before + selectedText + after + markdown.substring(end)

      setMarkdown(newText)

      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + before.length, end + before.length)
      }, 0)
    },
    [markdown],
  )

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'document.md'
    link.click()
    URL.revokeObjectURL(url)
  }

  const toolbarActions = [
    { icon: Heading1, action: () => insertText('# '), title: 'Heading 1' },
    { icon: Heading2, action: () => insertText('## '), title: 'Heading 2' },
    { icon: Bold, action: () => insertText('**', '**'), title: 'Bold' },
    { icon: Italic, action: () => insertText('_', '_'), title: 'Italic' },
    { icon: List, action: () => insertText('- '), title: 'Bullet List' },
    { icon: ListOrdered, action: () => insertText('1. '), title: 'Numbered List' },
    { icon: LinkIcon, action: () => insertText('[', '](url)'), title: 'Link' },
    { icon: Code, action: () => insertText('`', '`'), title: 'Inline Code' },
    {
      icon: Table,
      action: () => insertText('\n| Col 1 | Col 2 |\n| :--- | :--- |\n| Val 1 | Val 2 |\n'),
      title: 'Table',
    },
    { icon: CheckSquare, action: () => insertText('- [ ] '), title: 'Task List' },
  ]

  return (
    <ToolLayout title={tool.name} description={tool.description} icon={tool.icon}>
      <div className="flex flex-col gap-4">
        <div className="border-border flex flex-wrap items-center justify-between gap-4 border-b pb-4">
          <div className="flex flex-wrap items-center gap-1">
            {toolbarActions.map((item, i) => (
              <Button
                key={i}
                variant="ghost"
                size="icon"
                className="text-muted-foreground dark:hover:text-foreground h-8 w-8 hover:text-white"
                onClick={item.action}
                title={item.title}
              >
                <item.icon className="h-4 w-4" />
              </Button>
            ))}
            <div className="bg-border mx-2 hidden h-4 w-px sm:block" />
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-destructive h-8 w-8 hover:text-white"
              onClick={() => setMarkdown('')}
              title="Clear"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground dark:hover:text-foreground h-8 w-8 hover:text-white"
              onClick={() => setMarkdown(DEFAULT_MARKDOWN)}
              title="Reset"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                void copy(markdown)
              }}
              className="border-border bg-secondary/50 text-muted-foreground flex h-9 items-center justify-center gap-1.5 p-0 hover:text-white sm:w-auto sm:px-3"
            >
              {copied ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy Markdown'}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-secondary/30 hover:bg-secondary/80 text-muted-foreground hover:text-foreground h-8 gap-2 text-xs"
              onClick={handleDownload}
            >
              <Download className="h-3.5 w-3.5" />
              Download .md
            </Button>
          </div>
        </div>

        <Tabs defaultValue="both" className="w-full">
          <div className="mb-4 flex items-center justify-between">
            <TabsList className="grid w-[300px] grid-cols-3">
              <TabsTrigger value="edit" className="text-xs">
                <Edit3 className="mr-2 h-3.5 w-3.5" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview" className="text-xs">
                <Eye className="mr-2 h-3.5 w-3.5" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="both" className="hidden text-xs md:flex">
                Split
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="edit"
            className="ring-offset-background focus-visible:ring-ring mt-0 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <textarea
              ref={textareaRef}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              className="border-border bg-secondary/30 focus:ring-primary/20 min-h-[500px] w-full resize-y rounded-xl border p-4 font-mono text-sm focus:ring-1 focus:outline-none"
              placeholder="Enter markdown here..."
            />
          </TabsContent>

          <TabsContent
            value="preview"
            className="ring-offset-background focus-visible:ring-ring mt-0 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <div className="border-border bg-background min-h-[500px] max-w-none rounded-xl border p-8">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  h1: ({ ...props }) => (
                    <h1
                      {...props}
                      className="text-foreground mt-8 mb-4 border-b pb-2 text-2xl font-bold"
                    />
                  ),
                  h2: ({ ...props }) => (
                    <h2 {...props} className="text-foreground mt-6 mb-3 text-xl font-bold" />
                  ),
                  h3: ({ ...props }) => (
                    <h3 {...props} className="text-foreground mt-4 mb-2 text-lg font-bold" />
                  ),
                  p: ({ ...props }) => (
                    <p {...props} className="text-muted-foreground my-4 leading-relaxed" />
                  ),
                  ul: ({ ...props }) => (
                    <ul
                      {...props}
                      className="text-muted-foreground my-2 list-disc space-y-1 pl-6 [&_ul]:my-2"
                    />
                  ),
                  ol: ({ ...props }) => (
                    <ol
                      {...props}
                      className="text-muted-foreground my-2 list-decimal space-y-1 pl-6 [&_ol]:my-2"
                    />
                  ),
                  li: ({ ...props }) => <li {...props} className="mt-1 leading-relaxed" />,
                  blockquote: ({ ...props }) => (
                    <blockquote
                      {...props}
                      className="border-primary/30 text-muted-foreground bg-muted/30 my-6 rounded-r border-l-4 py-2 pl-4 italic"
                    />
                  ),
                  table: ({ ...props }) => (
                    <div className="border-border my-6 overflow-x-auto rounded-lg border">
                      <table {...props} className="w-full border-collapse text-sm" />
                    </div>
                  ),
                  thead: ({ ...props }) => <thead {...props} className="bg-muted/50" />,
                  th: ({ ...props }) => (
                    <th {...props} className="border-border border p-2 text-left font-semibold" />
                  ),
                  td: ({ ...props }) => <td {...props} className="border-border border p-2" />,
                  a: ({ ...props }) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary font-medium hover:underline"
                    />
                  ),
                  pre: ({ ...props }) => (
                    <pre
                      {...props}
                      className="bg-muted text-foreground mt-4 overflow-x-auto rounded-md p-4 text-xs leading-relaxed"
                    />
                  ),
                  code: ({ ...props }) => (
                    <code
                      {...props}
                      className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-[0.8em] font-medium"
                    />
                  ),
                }}
              >
                {markdown}
              </ReactMarkdown>
            </div>
          </TabsContent>

          <TabsContent
            value="both"
            className="ring-offset-background focus-visible:ring-ring mt-0 hidden focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none md:block"
          >
            <div className="grid h-[600px] grid-cols-2 gap-4">
              <textarea
                ref={textareaRef}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                className="border-border bg-secondary/30 focus:ring-primary/20 h-full w-full resize-none rounded-xl border p-4 font-mono text-sm focus:ring-1 focus:outline-none"
                placeholder="Enter markdown here..."
              />
              <div className="border-border bg-background h-full max-w-none overflow-y-auto rounded-xl border p-6">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    h1: ({ ...props }) => (
                      <h1
                        {...props}
                        className="text-foreground mt-8 mb-4 border-b pb-2 text-2xl font-bold"
                      />
                    ),
                    h2: ({ ...props }) => (
                      <h2 {...props} className="text-foreground mt-6 mb-3 text-xl font-bold" />
                    ),
                    h3: ({ ...props }) => (
                      <h3 {...props} className="text-foreground mt-4 mb-2 text-lg font-bold" />
                    ),
                    p: ({ ...props }) => (
                      <p {...props} className="text-muted-foreground my-4 leading-relaxed" />
                    ),
                    ul: ({ ...props }) => (
                      <ul
                        {...props}
                        className="text-muted-foreground my-2 list-disc space-y-1 pl-6 [&_ul]:my-2"
                      />
                    ),
                    ol: ({ ...props }) => (
                      <ol
                        {...props}
                        className="text-muted-foreground my-2 list-decimal space-y-1 pl-6 [&_ol]:my-2"
                      />
                    ),
                    li: ({ ...props }) => <li {...props} className="mt-1 leading-relaxed" />,
                    blockquote: ({ ...props }) => (
                      <blockquote
                        {...props}
                        className="border-primary/30 text-muted-foreground bg-muted/30 my-6 rounded-r border-l-4 py-2 pl-4 italic"
                      />
                    ),
                    table: ({ ...props }) => (
                      <div className="border-border my-6 overflow-x-auto rounded-lg border">
                        <table {...props} className="w-full border-collapse text-sm" />
                      </div>
                    ),
                    thead: ({ ...props }) => <thead {...props} className="bg-muted/50" />,
                    th: ({ ...props }) => (
                      <th {...props} className="border-border border p-2 text-left font-semibold" />
                    ),
                    td: ({ ...props }) => <td {...props} className="border-border border p-2" />,
                    a: ({ ...props }) => (
                      <a
                        {...props}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary font-medium hover:underline"
                      />
                    ),
                    pre: ({ ...props }) => (
                      <pre
                        {...props}
                        className="bg-muted text-foreground mt-4 overflow-x-auto rounded-md p-4 text-xs leading-relaxed"
                      />
                    ),
                    code: ({ ...props }) => (
                      <code
                        {...props}
                        className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-[0.8em] font-medium"
                      />
                    ),
                  }}
                >
                  {markdown}
                </ReactMarkdown>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ToolLayout>
  )
}
