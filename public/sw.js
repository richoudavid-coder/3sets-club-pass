// Service Worker 3SETS Club Pass
const CACHE_NAME = '3sets-club-pass-v2'
const APP_SHELL = ['/', '/manifest.json', '/favicon.svg', '/logo-white.svg', '/logo-yellow.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    clients.claim(),
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  ]))
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return
  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone()
    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy))
    return response
  }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('/'))))
})

// Gestion des notifications push
self.addEventListener('push', (event) => {
  if (!event.data) return
  
  let data
  try { data = event.data.json() } catch { return }
  if (!data || typeof data.title !== 'string') return
  const options = {
    body: data.message,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: [
      { action: 'open', title: 'Voir l\'offre' },
      { action: 'close', title: 'Fermer' }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Clic sur la notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  if (event.action === 'close') return
  
  const url = new URL(event.notification.data?.url || '/', self.location.origin).href
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})
