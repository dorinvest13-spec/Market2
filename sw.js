const CACHE = 'aipost-v1';
const CORE = ['./', './index.html', './manifest.webmanifest'];
const OFFLINE = () => new Response('Offline', { status: 503, headers: { 'content-type': 'text/plain' } });

self.addEventListener('install', e => {
  e.waitUntil(
    (async () => {
      const c = await caches.open(CACHE);
      for (const u of CORE) { try { await c.add(u); } catch {} }
    })().then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (e.request.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const r = await fetch(e.request);
        caches.open(CACHE).then(c => c.put(e.request, r.clone())).catch(() => {});
        return r;
      } catch {
        return (await caches.match('./index.html')) || OFFLINE();
      }
    })());
    return;
  }
  e.respondWith((async () => {
    const c = await caches.match(e.request);
    if (c) return c;
    try {
      const r = await fetch(e.request);
      if (r.status === 200) caches.open(CACHE).then(cc => cc.put(e.request, r.clone())).catch(() => {});
      return r;
    } catch { return OFFLINE(); }
  })());
});
