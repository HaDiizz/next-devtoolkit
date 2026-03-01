import type { MetadataRoute } from 'next'
import { tools } from '@/lib/tools'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://next-devtoolkit.vercel.app'

  const toolUrls = tools.map((tool) => ({
    url: `${baseUrl}/tools/${tool.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
    ...toolUrls,
  ]
}
