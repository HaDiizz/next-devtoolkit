/// <reference lib="webworker" />
import { defaultCache } from '@serwist/turbopack/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist, CacheFirst } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

const STATIC_ASSETS = ['/', '/~offline', '/manifest.webmanifest', '/favicon.ico']

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
      matcher({ request }) {
        return STATIC_PATTERNS.some((pattern) => pattern.test(new URL(request.url).pathname))
      },
      handler: new CacheFirst({
        cacheName: 'devtoolkit-static-v2',
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

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open('devtoolkit-precache-v2').then((cache) => cache.addAll(STATIC_ASSETS)),
  )
})
