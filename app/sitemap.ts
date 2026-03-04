import type { MetadataRoute } from 'next'
import { tools } from '@/lib/tools'

export const revalidate = 3600

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://next-devtoolkit.vercel.app'

  return [
    {
      url: baseUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...tools.map((tool) => ({
      url: `${baseUrl}/tools/${tool.id}`,
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]
}
