// Realms Field service worker: offline-capable app shell.
const CACHE = 'realms-v1'

self.addEventListener('install', () => { self.skipWaiting() })

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))))
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return // don't touch Supabase, tiles, APIs
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req)
      const network = fetch(req).then((res) => {
        if (res && res.status === 200) cache.put(req, res.clone())
        return res
      }).catch(() => cached || (req.mode === 'navigate' ? cache.match('/') : undefined))
      return cached || network
    })
  )
})
