const CACHE_NAME = "pwa-h5p-v1";

const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/h5p/content.html"
  // idealnya auto-cache seluruh folder h5p
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
