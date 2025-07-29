var CACHE_NAME = 'PWA';
var urlsToCache = [
    './',              // ルートとなる index.html を含む（あるいは './index.html' としても良い）
    './index.html',
    './manifest.json',
    './sw.js',
    './PWAimage/slime192.png',
    './PWAimage/slime512.png',
    './index-fixed.html',
    './index.html',
    './board-random.js',
    './main.js',
    './bug-system.js',
    './styles.css',
    './normal.css',
    './font-fallback.css',
    './font-manager.js'
];


// インストール処理
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

// リソースフェッチ時のキャッシュロード処理
self.addEventListener('fetch', function(event) {
    // Google Fonts のリクエストを検出
    if (event.request.url.indexOf('fonts.googleapis.com') !== -1 || 
        event.request.url.indexOf('fonts.gstatic.com') !== -1) {
        event.respondWith(
            caches.open('fonts-cache').then(function(cache) {
                return cache.match(event.request).then(function(response) {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request).then(function(response) {
                        if (response.status === 200) {
                            cache.put(event.request, response.clone());
                        }
                        return response;
                    });
                });
            })
        );
    } else {
        event.respondWith(
            caches
                .match(event.request)
                .then(function(response) {
                    return response || fetch(event.request);
                })
        );
    }
});