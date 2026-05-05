const CACHE = "impersilva-pwa-v1";
const URLS = [
  "/IMPERSILVA/index.html",
  "/IMPERSILVA/style.css",
  "/IMPERSILVA/script.js",
  "/IMPERSILVA/icon-192.svg",
  "/IMPERSILVA/icon-512.svg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(URLS))
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((resp) => resp || fetch(e.request))
  );
});
