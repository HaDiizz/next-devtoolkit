const CACHE_VERSION = 'devtoolkit-v2'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`
const ALL_CACHES = [STATIC_CACHE, DYNAMIC_CACHE]

const STATIC_ASSETS = [
    '/',
    '/offline',
    '/manifest.webmanifest',
    '/favicon.ico',
]

const STATIC_PATTERNS = [
    /^\/_next\/static\//,
    /\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|eot)$/,
]

self.addEventListener('install', (event) => {
    self.skipWaiting()
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) =>
            cache.addAll(STATIC_ASSETS)
        )
    )
})

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((key) => !ALL_CACHES.includes(key))
                        .map((key) => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    )
})

function isStaticAsset(url) {
    return STATIC_PATTERNS.some((pattern) => pattern.test(new URL(url).pathname))
}

function isNavigationRequest(request) {
    return request.mode === 'navigate'
}

async function cacheFirst(request, cacheName) {
    const cached = await caches.match(request)
    if (cached) return cached

    try {
        const response = await fetch(request)
        if (response.ok) {
            const cache = await caches.open(cacheName)
            cache.put(request, response.clone())
        }
        return response
    } catch {
        return caches.match('/offline')
    }
}

async function networkFirst(request) {
    try {
        const response = await fetch(request)
        if (response.ok) {
            const cache = await caches.open(DYNAMIC_CACHE)
            cache.put(request, response.clone())
        }
        return response
    } catch {
        const cached = await caches.match(request)
        if (cached) return cached
        return caches.match('/offline')
    }
}

self.addEventListener('fetch', (event) => {
    const { request } = event

    if (request.method !== 'GET') return

    if (isStaticAsset(request.url)) {
        event.respondWith(cacheFirst(request, STATIC_CACHE))
        return
    }

    if (isNavigationRequest(request)) {
        event.respondWith(networkFirst(request))
        return
    }

    event.respondWith(networkFirst(request))
})
