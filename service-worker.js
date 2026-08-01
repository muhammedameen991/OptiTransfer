const CACHE_NAME = 'optitransfer-v1';
const ASSETS = [
    '/', '/index.html', '/css/style.css', '/js/app.js',
    '/js/utils.js', '/js/ui.js', '/js/fileManager.js',
    '/js/encoder.js', '/js/decoder.js', '/js/frameGenerator.js', '/js/camera.js'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', event => {
    event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});
