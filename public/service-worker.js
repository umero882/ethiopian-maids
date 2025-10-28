/**
 * Ethiopian Maids Service Worker
 * Provides offline functionality, caching, and background sync
 */

const CACHE_VERSION = 'ethio-maids-v1.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Maximum cache sizes
const MAX_DYNAMIC_CACHE_SIZE = 50;
const MAX_IMAGE_CACHE_SIZE = 100;
const MAX_API_CACHE_SIZE = 30;

// Cache duration (in milliseconds)
const CACHE_DURATION = {
  static: 30 * 24 * 60 * 60 * 1000,  // 30 days
  dynamic: 7 * 24 * 60 * 60 * 1000,   // 7 days
  images: 14 * 24 * 60 * 60 * 1000,   // 14 days
  api: 5 * 60 * 1000,                  // 5 minutes
};

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/images/logo/ethiopian-maids-logo.png',
  '/images/default-avatar.png',
];

// API endpoints that should work offline
const OFFLINE_API_ENDPOINTS = [
  '/api/profile',
  '/api/bookings',
  '/api/favorites',
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[ServiceWorker] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[ServiceWorker] Installation complete');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[ServiceWorker] Installation failed:', error);
      })
  );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Delete old version caches
              return cacheName.startsWith('ethio-maids-') &&
                     !cacheName.startsWith(CACHE_VERSION);
            })
            .map((cacheName) => {
              console.log('[ServiceWorker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] Activation complete');
        return self.clients.claim(); // Take control immediately
      })
  );
});

/**
 * Fetch event - serve from cache with network fallback
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (isImageRequest(url)) {
    event.respondWith(handleImageRequest(request));
  } else if (isApiRequest(url)) {
    event.respondWith(handleApiRequest(request));
  } else if (isStaticAsset(url)) {
    event.respondWith(handleStaticRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

/**
 * Handle static asset requests (cache first)
 */
async function handleStaticRequest(request) {
  try {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      // Return cached version if not expired
      const cacheDate = new Date(cachedResponse.headers.get('sw-cache-date'));
      const age = Date.now() - cacheDate.getTime();

      if (age < CACHE_DURATION.static) {
        return cachedResponse;
      }
    }

    // Fetch from network and update cache
    const response = await fetch(request);

    if (response && response.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      const clonedResponse = response.clone();
      const headers = new Headers(clonedResponse.headers);
      headers.set('sw-cache-date', new Date().toISOString());

      const cachedResponse = new Response(clonedResponse.body, {
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
        headers: headers,
      });

      cache.put(request, cachedResponse);
    }

    return response;
  } catch (error) {
    // Return cached version or offline page
    const cachedResponse = await caches.match(request);
    return cachedResponse || caches.match('/offline.html');
  }
}

/**
 * Handle dynamic page requests (network first)
 */
async function handleDynamicRequest(request) {
  try {
    const response = await fetch(request);

    if (response && response.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());

      // Limit cache size
      limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_SIZE);
    }

    return response;
  } catch (error) {
    // Try to serve from cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }

    throw error;
  }
}

/**
 * Handle image requests (cache first, with fallback)
 */
async function handleImageRequest(request) {
  try {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    const response = await fetch(request);

    if (response && response.status === 200) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, response.clone());

      // Limit cache size
      limitCacheSize(IMAGE_CACHE, MAX_IMAGE_CACHE_SIZE);
    }

    return response;
  } catch (error) {
    // Return default avatar for profile images
    if (request.url.includes('profile') || request.url.includes('avatar')) {
      return caches.match('/images/default-avatar.png');
    }

    throw error;
  }
}

/**
 * Handle API requests (network first with short cache)
 */
async function handleApiRequest(request) {
  try {
    const response = await fetch(request);

    if (response && response.status === 200) {
      const cache = await caches.open(API_CACHE);
      const clonedResponse = response.clone();
      const headers = new Headers(clonedResponse.headers);
      headers.set('sw-cache-date', new Date().toISOString());

      const cachedResponse = new Response(clonedResponse.body, {
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
        headers: headers,
      });

      cache.put(request, cachedResponse);

      // Limit cache size
      limitCacheSize(API_CACHE, MAX_API_CACHE_SIZE);
    }

    return response;
  } catch (error) {
    // Try to serve stale cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      // Add header to indicate stale data
      const headers = new Headers(cachedResponse.headers);
      headers.set('X-From-Cache', 'true');

      return new Response(cachedResponse.body, {
        status: cachedResponse.status,
        statusText: cachedResponse.statusText,
        headers: headers,
      });
    }

    throw error;
  }
}

/**
 * Background sync for pending actions
 */
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);

  if (event.tag === 'sync-pending-actions') {
    event.waitUntil(syncPendingActions());
  } else if (event.tag === 'sync-profile-updates') {
    event.waitUntil(syncProfileUpdates());
  } else if (event.tag === 'sync-bookings') {
    event.waitUntil(syncBookings());
  }
});

/**
 * Sync pending actions from IndexedDB
 */
async function syncPendingActions() {
  try {
    // Get pending actions from IndexedDB
    const db = await openDatabase();
    const actions = await getAllPendingActions(db);

    console.log('[ServiceWorker] Syncing', actions.length, 'pending actions');

    for (const action of actions) {
      try {
        // Attempt to perform the action
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body,
        });

        if (response.ok) {
          // Remove from pending queue
          await removePendingAction(db, action.id);

          // Notify clients
          notifyClients({
            type: 'SYNC_SUCCESS',
            action: action.type,
            data: await response.json(),
          });
        }
      } catch (error) {
        console.error('[ServiceWorker] Failed to sync action:', error);
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Sync failed:', error);
    throw error; // Retry sync
  }
}

/**
 * Sync profile updates
 */
async function syncProfileUpdates() {
  // Implementation for profile-specific sync
  console.log('[ServiceWorker] Syncing profile updates');
}

/**
 * Sync bookings
 */
async function syncBookings() {
  // Implementation for booking-specific sync
  console.log('[ServiceWorker] Syncing bookings');
}

/**
 * Push notification handling
 */
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push notification received');

  let data = {
    title: 'Ethiopian Maids',
    body: 'You have a new notification',
    icon: '/images/logo/ethiopian-maids-logo.png',
    badge: '/images/logo/badge-icon.png',
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (error) {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      data: data.data,
      actions: data.actions,
    })
  );
});

/**
 * Notification click handling
 */
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked');

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }

        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

/**
 * Message handling from clients
 */
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches());
  } else if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(cacheUrls(event.data.urls));
  }
});

// ==================== Helper Functions ====================

function isImageRequest(url) {
  return /\.(jpg|jpeg|png|gif|svg|webp|ico)$/i.test(url.pathname);
}

function isApiRequest(url) {
  return url.pathname.startsWith('/api/') ||
         url.hostname.includes('supabase.co');
}

function isStaticAsset(url) {
  return /\.(js|css|woff|woff2|ttf|eot)$/i.test(url.pathname) ||
         STATIC_ASSETS.includes(url.pathname);
}

async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length > maxSize) {
    // Remove oldest entries
    const toDelete = keys.length - maxSize;
    for (let i = 0; i < toDelete; i++) {
      await cache.delete(keys[i]);
    }
  }
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map((cacheName) => caches.delete(cacheName))
  );
}

async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  return cache.addAll(urls);
}

function notifyClients(message) {
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage(message);
    });
  });
}

// IndexedDB helpers (simplified)
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ethio-maids-offline', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('pendingActions')) {
        db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getAllPendingActions(db) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingActions'], 'readonly');
    const store = transaction.objectStore('pendingActions');
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function removePendingAction(db, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['pendingActions'], 'readwrite');
    const store = transaction.objectStore('pendingActions');
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

console.log('[ServiceWorker] Service worker loaded');
