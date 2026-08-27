/* Shot Tracker service worker.

   Two rules, and the reasons matter:

   1. INSTALL FETCHES WITH cache:'reload'. `cache.addAll()` is allowed to satisfy itself
      from the browser's HTTP cache, and GitHub Pages serves index.html with a max-age.
      So bumping this file's CACHE name was re-caching the *stale* page under a new name —
      the app looked updated (new cache, new service worker) while still running old code
      for as long as the HTTP cache held. That is how a fixed bug kept being reported.

   2. NAVIGATIONS ARE NETWORK-FIRST. The page itself comes from the network whenever there
      is a network, and falls back to the cache when there isn't. Everything else — icons,
      manifest — stays cache-first, because those do not change and speed matters more.
      The app still opens with no signal; it just stops being able to serve a stale app to
      someone who is online. */
const CACHE = 'shot-tracker-v17';
const SHELL = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(SHELL.map(u =>
        fetch(u, {cache: 'reload'})
          .then(res => (res && res.ok) ? c.put(u, res) : null)
          .catch(() => null)                       /* offline install: fill what we can */
      )))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate'){
    e.respondWith(
      fetch(req, {cache: 'no-store'})
        .then(res => {
          /* The write has to be handed to waitUntil. A bare promise here is not enough —
             the worker can be shut down the moment the response is returned, and the copy
             never lands, which leaves the offline fallback serving the previous build. */
          if (res && res.ok){
            const copy = res.clone();
            e.waitUntil(caches.open(CACHE).then(c => c.put('./index.html', copy)));
          }
          return res;
        })
        .catch(() => caches.match('./index.html').then(hit => hit || caches.match('./')))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => {
      const net = fetch(req).then(res => {
        if (res && res.status === 200 && res.type === 'basic'){
          const copy = res.clone();
          e.waitUntil(caches.open(CACHE).then(c => c.put(req, copy)));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
