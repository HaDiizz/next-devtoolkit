import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { tools } from '@/lib/tools'
import { getToolComponent } from '@/lib/tool-registry'

type Props = {
  params: Promise<{ toolId: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { toolId } = await params
  const tool = tools.find((t) => t.id === toolId)

  if (!tool) return {}

  return {
    title: tool.name,
    description: tool.description,
    openGraph: {
      title: `${tool.name} | DevToolkit`,
      description: tool.description,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${tool.name} | DevToolkit`,
      description: tool.description,
    },
  }
}

export default async function ToolPage({ params }: Props) {
  const { toolId } = await params
  const tool = tools.find((t) => t.id === toolId)
  if (!tool) notFound()

  const Component = getToolComponent(toolId)
  if (!Component) notFound()

  return <Component />
}
