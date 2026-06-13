// Barrier Island Digital marketing site — network-first for HTML, cache-first for static assets.
// Pattern: HTML always fresh on each visit (so users never see stale deploys);
// CSS/JS/images cached after first download — invalidated by hashed filenames.
//
// This SW exists so that a user who once loads the site never has to manually
// clear their cache again. After the first install, every future deploy is
// picked up automatically on the next navigation.

const CACHE = 'bid-v20260613a';

self.addEventListener('install', e => {
  // Pre-cache the shell, but don't block install on it.
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll(['./', './site.webmanifest']).catch(() => {})
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  // Delete ALL old caches (including any older versions).
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const sameOrigin = url.origin === location.origin;
  if (!sameOrigin) return; // let cross-origin go straight through (fonts, weather API, etc.)

  // Never cache or interfere with version.json or sw.js itself.
  if (url.pathname === '/version.json' || url.pathname === '/sw.js') return;

  const isHTML =
    e.request.mode === 'navigate' ||
    e.request.destination === 'document' ||
    url.pathname === '/' ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('.html');

  if (isHTML) {
    // Network-first for HTML. Always show the latest page; fall back to cache offline.
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .then(res => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(e.request).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }

  // Cache-first for everything else (CSS/JS/images/fonts). Hashed URLs handle updates.
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => undefined))
  );
});

// Allow the page to force-update the SW
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
