// ============================================
// OptiTransfer Service Worker
// Version: 1.0.0
// ============================================

const CACHE_NAME = "optitransfer-v1";

const STATIC_ASSETS = [
    "./",
    "./index.html",
    "./manifest.json",

    "./css/style.css",

    "./js/app.js",
    "./js/camera.js",
    "./js/decoder.js",
    "./js/fileManager.js",
    "./js/frameGenerator.js",
    "./js/utils.js",

    "./icons/icon-192.png",
    "./icons/icon-512.png"
];

// Install
self.addEventListener("install", (event) => {

    event.waitUntil(

        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())

    );

});

// Activate
self.addEventListener("activate", (event) => {

    event.waitUntil(

        caches.keys().then(keys => {

            return Promise.all(

                keys.map(key => {

                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }

                })

            );

        }).then(() => self.clients.claim())

    );

});

// Fetch

self.addEventListener("fetch", (event) => {

    if (event.request.method !== "GET") return;

    event.respondWith(

        caches.match(event.request).then(cacheResponse => {

            if (cacheResponse) {

                return cacheResponse;

            }

            return fetch(event.request)
                .then(networkResponse => {

                    const clone = networkResponse.clone();

                    caches.open(CACHE_NAME).then(cache => {

                        cache.put(event.request, clone);

                    });

                    return networkResponse;

                })
                .catch(() => {

                    return caches.match("./index.html");

                });

        })

    );

});
