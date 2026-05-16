const CACHE = "webmail-v1";

const APP_SHELL = [
  "/mail",
  "/mail/login",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  // Only handle same-origin GETs; skip API/POST requests
  const { request } = e;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // API routes — network only, no caching
  if (url.pathname.startsWith("/api/")) return;

  e.respondWith(
    fetch(request)
      .then((res) => {
        // Cache successful navigation responses
        if (res.ok && request.mode === "navigate") {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request))
  );
});
