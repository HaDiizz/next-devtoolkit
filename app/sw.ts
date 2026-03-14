/// <reference lib="webworker" />

import { defaultCache } from '@serwist/turbopack/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist, CacheFirst, NetworkFirst } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const CACHE_VERSION = (self.__SW_MANIFEST?.[0] as PrecacheEntry | undefined)?.revision ?? 'dev'

const STATIC_PATTERNS = [
  /^\/_next\/static\//,
  /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|eot)$/,
]

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,

  runtimeCaching: [
    {
      matcher: ({ request }) => request.mode === 'navigate',
      handler: new NetworkFirst({
        cacheName: `pages-${CACHE_VERSION}`,
        networkTimeoutSeconds: 3,
      }),
    },

    {
      matcher({ request }) {
        return STATIC_PATTERNS.some((pattern) => pattern.test(new URL(request.url).pathname))
      },
      handler: new CacheFirst({
        cacheName: `static-${CACHE_VERSION}`,
      }),
    },

    {
      matcher: ({ url }) => url.pathname.startsWith('/api/'),
      handler: new NetworkFirst({
        cacheName: 'api-cache',
        networkTimeoutSeconds: 5,
      }),
    },

    ...defaultCache,
  ],

  fallbacks: {
    entries: [
      {
        url: '/~offline',
        matcher({ request }) {
          return request.destination === 'document'
        },
      },
    ],
  },
})

serwist.addEventListeners()

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => !key.includes(CACHE_VERSION)).map((key) => caches.delete(key)),
        ),
      ),
  )
})
