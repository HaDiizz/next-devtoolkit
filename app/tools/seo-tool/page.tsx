import { Metadata } from 'next'
import SeoTool from '@/components/tools/seo-tool'

export const metadata: Metadata = {
  title: 'SEO Toolkit',
  description:
    'Preview OpenGraph cards, score your SEO, check best practices, generate manifest.json, and export favicon assets.',
}

export default function SeoToolPage() {
  return <SeoTool />
}
