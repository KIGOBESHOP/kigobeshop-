
const CACHE_NAME = "kigobeshop-static-v1";

const STATIC_ASSETS = [
  "/",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-512-maskable.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith("kigobeshop-") &&
              key !== CACHE_NAME
          )
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});
