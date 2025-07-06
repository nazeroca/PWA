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
    './styles.css'
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
    event.respondWith(
        caches
            .match(event.request)
            .then(function(response) {
                return response || fetch(event.request);
            })
    );
});