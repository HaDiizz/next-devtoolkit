import { spawnSync } from 'node:child_process'
import { createSerwistRoute } from '@serwist/turbopack'

function getRevision() {
  try {
    const git = spawnSync('git', ['rev-parse', 'HEAD'], {
      encoding: 'utf-8',
    })

    if (git.status === 0) {
      const hash = git.stdout.trim()
      if (hash) return hash
    }
  } catch {}

  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    return process.env.VERCEL_GIT_COMMIT_SHA
  }

  return crypto.randomUUID()
}

const revision = getRevision()

export const { GET, dynamic, dynamicParams, revalidate, generateStaticParams } = createSerwistRoute(
  {
    swSrc: 'app/sw.ts',

    additionalPrecacheEntries: [
      {
        url: '/~offline',
        revision,
      },
    ],

    useNativeEsbuild: true,
  },
)
