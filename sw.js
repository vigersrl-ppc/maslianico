// Service worker — Piano di Protezione Civile, Comune di Oggiono
// Cache-first per i documenti (una volta aperti restano offline),
// network-first per la pagina così gli aggiornamenti arrivano subito quando c'è rete.

const CACHE_NAME = 'ppc-maslianico-v1';

const APP_SHELL = [
  './',
  './piano-protezione-civile.html',
  './manifest.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isDocument = url.pathname.endsWith('.pdf');

  if (isDocument) {
    // Cache-first: un documento aperto una volta resta disponibile senza connessione.
    event.respondWith(
      caches.match(req).then((cached) => {
        const fetchPromise = fetch(req).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return res;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  // Network-first per l'interfaccia: se c'è rete prende sempre l'ultima versione,
  // altrimenti ripiega su quanto già salvato in cache.
  event.respondWith(
    fetch(req)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
