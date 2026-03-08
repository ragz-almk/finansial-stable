// Ubah versi setiap kali kamu mengupdate file agar cache lama terganti
const CACHE_NAME = 'finansial-v2'; 

// HANYA simpan file lokal milikmu sendiri
const assets = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js'
];

// Tahap Install: Simpan file lokal ke Cache
self.addEventListener('install', (e) => {
  self.skipWaiting(); // Memaksa SW baru untuk segera aktif
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(assets);
    })
  );
});

// Tahap Activate: Bersihkan cache versi lama
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Cache lama dihapus');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Tahap Fetch: Strategi "Network First, fallback to Cache"
self.addEventListener('fetch', (e) => {
  // 1. JANGAN mencegat request POST (seperti API Gemini kita) atau request ke Firebase
  if (e.request.method !== 'GET' || e.request.url.includes('firestore') || e.request.url.includes('/api/')) {
    return; // Biarkan browser yang mengurusnya secara normal
  }

  // 2. Untuk file lain, coba ambil dari internet dulu. Kalau offline, baru pakai cache.
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // (Opsional) Update cache dengan file terbaru dari internet
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, resClone);
        });
        return response;
      })
      .catch(() => {
        // Jika internet mati/gagal, ambil dari cache
        return caches.match(e.request);
      })
  );
});
