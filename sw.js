/* ============================================================
   IMPERSILVA HOLDING SGPS — Service Worker
   Estratégia: Cache-First para assets estáticos,
               Network-First para páginas HTML.
   ============================================================ */

const CACHE_NAME      = 'impersilva-v1';
const OFFLINE_PAGE    = '/offline.html';

/* Assets que devem ser pré-cacheados na instalação */
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/sobre.html',
  '/projetos.html',
  '/consultoria.html',
  '/tech.html',
  '/contacto.html',
  '/verificar-site.html',
  '/offline.html',
  '/js/config.js',
  '/manifest.json',
  '/icons/icon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

/* ── INSTALL ─────────────────────────────────────────────── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => console.warn('[SW] Pré-cache parcial:', err))
  );
});

/* ── ACTIVATE ────────────────────────────────────────────── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => {
            console.log('[SW] Apagar cache antigo:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

/* ── FETCH ───────────────────────────────────────────────── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  /* Ignorar requests que não são GET ou que são de outras origens */
  if (request.method !== 'GET') return;
  if (url.origin !== location.origin &&
      !url.href.startsWith('https://fonts.googleapis.com') &&
      !url.href.startsWith('https://fonts.gstatic.com') &&
      !url.href.startsWith('https://cdnjs.cloudflare.com')) return;

  /* Fontes e CDN externos → Cache-First (mudam raramente) */
  if (
    url.href.includes('fonts.googleapis.com') ||
    url.href.includes('fonts.gstatic.com') ||
    url.href.includes('cdnjs.cloudflare.com')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  /* Assets estáticos (imagens, CSS, JS, SVG, fontes locais) → Cache-First */
  if (/\.(css|js|png|jpg|jpeg|webp|svg|ico|woff2?|ttf)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  /* Páginas HTML → Network-First (garantir conteúdo fresco) */
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request));
    return;
  }

  /* Tudo o resto → Network-First */
  event.respondWith(networkFirst(request));
});

/* ── ESTRATÉGIAS ─────────────────────────────────────────── */

/**
 * Cache-First: serve do cache, só vai à rede se não houver.
 * Actualiza o cache em background após servir.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    /* Actualizar em background sem bloquear */
    fetchAndCache(request).catch(() => {});
    return cached;
  }
  return fetchAndCache(request);
}

/**
 * Network-First: tenta rede, cai para cache se offline.
 * Se não houver cache, serve a página offline.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    /* Último recurso: página offline */
    const offline = await caches.match(OFFLINE_PAGE);
    return offline || new Response(
      '<h1>Sem ligação</h1><p>Verifique a sua conexão à internet.</p>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

/** Faz fetch e guarda no cache. */
async function fetchAndCache(request) {
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}

/* ── BACKGROUND SYNC (futuro) ────────────────────────────── */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-forms') {
    event.waitUntil(syncPendingForms());
  }
});

async function syncPendingForms() {
  /* Reservado para sincronização de formulários offline */
  console.log('[SW] Background sync: formulários');
}

/* ── PUSH NOTIFICATIONS (futuro) ────────────────────────── */
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'IMPERSILVA', {
      body:    data.body    || '',
      icon:    data.icon    || '/icons/icon-192.png',
      badge:   data.badge   || '/icons/icon-96.png',
      vibrate: [200, 100, 200],
      data:    { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((wins) => {
      const match = wins.find((w) => w.url === target && 'focus' in w);
      if (match) return match.focus();
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});
