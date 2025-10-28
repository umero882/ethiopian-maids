/**
 * Offline Storage Manager
 * Handles IndexedDB operations for offline data persistence
 */

const DB_NAME = 'ethio-maids-offline';
const DB_VERSION = 1;

const STORES = {
  PENDING_ACTIONS: 'pendingActions',
  CACHED_PROFILES: 'cachedProfiles',
  CACHED_BOOKINGS: 'cachedBookings',
  CACHED_MAIDS: 'cachedMaids',
  SYNC_QUEUE: 'syncQueue',
  USER_PREFERENCES: 'userPreferences',
};

/**
 * Initialize IndexedDB
 */
export async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB failed to open:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Pending actions store
      if (!db.objectStoreNames.contains(STORES.PENDING_ACTIONS)) {
        const store = db.createObjectStore(STORES.PENDING_ACTIONS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('status', 'status', { unique: false });
      }

      // Cached profiles store
      if (!db.objectStoreNames.contains(STORES.CACHED_PROFILES)) {
        const store = db.createObjectStore(STORES.CACHED_PROFILES, {
          keyPath: 'id',
        });
        store.createIndex('userId', 'userId', { unique: true });
        store.createIndex('lastUpdated', 'lastUpdated', { unique: false });
      }

      // Cached bookings store
      if (!db.objectStoreNames.contains(STORES.CACHED_BOOKINGS)) {
        const store = db.createObjectStore(STORES.CACHED_BOOKINGS, {
          keyPath: 'id',
        });
        store.createIndex('userId', 'userId', { unique: false });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('lastUpdated', 'lastUpdated', { unique: false });
      }

      // Cached maids store
      if (!db.objectStoreNames.contains(STORES.CACHED_MAIDS)) {
        const store = db.createObjectStore(STORES.CACHED_MAIDS, {
          keyPath: 'id',
        });
        store.createIndex('nationality', 'nationality', { unique: false });
        store.createIndex('availability', 'availability', { unique: false });
        store.createIndex('lastUpdated', 'lastUpdated', { unique: false });
      }

      // Sync queue store
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        const store = db.createObjectStore(STORES.SYNC_QUEUE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('action', 'action', { unique: false });
        store.createIndex('priority', 'priority', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // User preferences store
      if (!db.objectStoreNames.contains(STORES.USER_PREFERENCES)) {
        db.createObjectStore(STORES.USER_PREFERENCES, { keyPath: 'key' });
      }
    };
  });
}

/**
 * Generic database operation wrapper
 */
async function performDBOperation(storeName, mode, operation) {
  try {
    const db = await initDB();
    const transaction = db.transaction([storeName], mode);
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = operation(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);

      transaction.oncomplete = () => db.close();
      transaction.onerror = () => {
        db.close();
        reject(transaction.error);
      };
    });
  } catch (error) {
    console.error('Database operation failed:', error);
    throw error;
  }
}

// ==================== Pending Actions ====================

/**
 * Add a pending action to the queue
 */
export async function addPendingAction(action) {
  const actionData = {
    ...action,
    timestamp: Date.now(),
    status: 'pending',
    retryCount: 0,
  };

  return performDBOperation(
    STORES.PENDING_ACTIONS,
    'readwrite',
    (store) => store.add(actionData)
  );
}

/**
 * Get all pending actions
 */
export async function getPendingActions() {
  return performDBOperation(
    STORES.PENDING_ACTIONS,
    'readonly',
    (store) => store.getAll()
  );
}

/**
 * Remove a pending action
 */
export async function removePendingAction(id) {
  return performDBOperation(
    STORES.PENDING_ACTIONS,
    'readwrite',
    (store) => store.delete(id)
  );
}

/**
 * Update pending action status
 */
export async function updatePendingActionStatus(id, status, error = null) {
  return performDBOperation(
    STORES.PENDING_ACTIONS,
    'readwrite',
    async (store) => {
      const action = await new Promise((resolve, reject) => {
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      if (action) {
        action.status = status;
        action.lastAttempt = Date.now();
        if (error) action.error = error;
        if (status === 'retrying') action.retryCount++;

        return store.put(action);
      }
    }
  );
}

// ==================== Cached Data ====================

/**
 * Cache user profile
 */
export async function cacheProfile(userId, profileData) {
  const data = {
    id: `profile_${userId}`,
    userId,
    ...profileData,
    lastUpdated: Date.now(),
  };

  return performDBOperation(
    STORES.CACHED_PROFILES,
    'readwrite',
    (store) => store.put(data)
  );
}

/**
 * Get cached profile
 */
export async function getCachedProfile(userId) {
  const result = await performDBOperation(
    STORES.CACHED_PROFILES,
    'readonly',
    (store) => store.index('userId').get(userId)
  );

  // Check if cache is expired (older than 1 hour)
  if (result && Date.now() - result.lastUpdated > 60 * 60 * 1000) {
    return null;
  }

  return result;
}

/**
 * Cache bookings
 */
export async function cacheBookings(userId, bookings) {
  const db = await initDB();
  const transaction = db.transaction([STORES.CACHED_BOOKINGS], 'readwrite');
  const store = transaction.objectStore('cachedBookings');

  // Clear old bookings for this user
  const index = store.index('userId');
  const oldBookings = await new Promise((resolve) => {
    const req = index.getAll(userId);
    req.onsuccess = () => resolve(req.result);
  });

  for (const booking of oldBookings) {
    store.delete(booking.id);
  }

  // Add new bookings
  const timestamp = Date.now();
  for (const booking of bookings) {
    store.put({
      ...booking,
      userId,
      lastUpdated: timestamp,
    });
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

/**
 * Get cached bookings
 */
export async function getCachedBookings(userId) {
  const results = await performDBOperation(
    STORES.CACHED_BOOKINGS,
    'readonly',
    (store) => store.index('userId').getAll(userId)
  );

  // Check if cache is expired (older than 30 minutes)
  if (results.length > 0 && Date.now() - results[0].lastUpdated > 30 * 60 * 1000) {
    return null;
  }

  return results;
}

/**
 * Cache maids list
 */
export async function cacheMaids(maids) {
  const db = await initDB();
  const transaction = db.transaction([STORES.CACHED_MAIDS], 'readwrite');
  const store = transaction.objectStore(STORES.CACHED_MAIDS);

  const timestamp = Date.now();
  for (const maid of maids) {
    store.put({
      ...maid,
      lastUpdated: timestamp,
    });
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

/**
 * Get cached maids
 */
export async function getCachedMaids(filters = {}) {
  let results = await performDBOperation(
    STORES.CACHED_MAIDS,
    'readonly',
    (store) => store.getAll()
  );

  // Check if cache is expired (older than 1 hour)
  if (results.length > 0 && Date.now() - results[0].lastUpdated > 60 * 60 * 1000) {
    return null;
  }

  // Apply filters
  if (filters.nationality) {
    results = results.filter(m => m.nationality === filters.nationality);
  }
  if (filters.availability) {
    results = results.filter(m => m.availability === filters.availability);
  }

  return results;
}

// ==================== Sync Queue ====================

/**
 * Add item to sync queue
 */
export async function addToSyncQueue(item) {
  const queueItem = {
    ...item,
    timestamp: Date.now(),
    priority: item.priority || 0,
    status: 'pending',
  };

  return performDBOperation(
    STORES.SYNC_QUEUE,
    'readwrite',
    (store) => store.add(queueItem)
  );
}

/**
 * Get sync queue items
 */
export async function getSyncQueue() {
  return performDBOperation(
    STORES.SYNC_QUEUE,
    'readonly',
    (store) => store.getAll()
  );
}

/**
 * Remove from sync queue
 */
export async function removeFromSyncQueue(id) {
  return performDBOperation(
    STORES.SYNC_QUEUE,
    'readwrite',
    (store) => store.delete(id)
  );
}

/**
 * Clear sync queue
 */
export async function clearSyncQueue() {
  return performDBOperation(
    STORES.SYNC_QUEUE,
    'readwrite',
    (store) => store.clear()
  );
}

// ==================== User Preferences ====================

/**
 * Save user preference
 */
export async function savePreference(key, value) {
  return performDBOperation(
    STORES.USER_PREFERENCES,
    'readwrite',
    (store) => store.put({ key, value, timestamp: Date.now() })
  );
}

/**
 * Get user preference
 */
export async function getPreference(key) {
  const result = await performDBOperation(
    STORES.USER_PREFERENCES,
    'readonly',
    (store) => store.get(key)
  );

  return result?.value;
}

/**
 * Get all preferences
 */
export async function getAllPreferences() {
  const results = await performDBOperation(
    STORES.USER_PREFERENCES,
    'readonly',
    (store) => store.getAll()
  );

  return results.reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {});
}

// ==================== Cleanup ====================

/**
 * Clear all offline data
 */
export async function clearAllOfflineData() {
  const db = await initDB();

  const promises = Object.values(STORES).map((storeName) => {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });

  await Promise.all(promises);
  db.close();
}

/**
 * Clear expired cache entries
 */
export async function clearExpiredCache() {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;

  const db = await initDB();

  // Clear expired profiles
  const profileTransaction = db.transaction([STORES.CACHED_PROFILES], 'readwrite');
  const profileStore = profileTransaction.objectStore(STORES.CACHED_PROFILES);
  const profileCursor = profileStore.openCursor();

  profileCursor.onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      if (now - cursor.value.lastUpdated > oneHour) {
        cursor.delete();
      }
      cursor.continue();
    }
  };

  // Clear expired bookings
  const bookingTransaction = db.transaction([STORES.CACHED_BOOKINGS], 'readwrite');
  const bookingStore = bookingTransaction.objectStore(STORES.CACHED_BOOKINGS);
  const bookingCursor = bookingStore.openCursor();

  bookingCursor.onsuccess = (event) => {
    const cursor = event.target.result;
    if (cursor) {
      if (now - cursor.value.lastUpdated > 30 * 60 * 1000) {
        cursor.delete();
      }
      cursor.continue();
    }
  };

  await Promise.all([
    new Promise((resolve) => {
      profileTransaction.oncomplete = resolve;
    }),
    new Promise((resolve) => {
      bookingTransaction.oncomplete = resolve;
    }),
  ]);

  db.close();
}

// ==================== Export utility ====================

export const offlineStorage = {
  // Initialization
  init: initDB,

  // Pending actions
  addPendingAction,
  getPendingActions,
  removePendingAction,
  updatePendingActionStatus,

  // Cached data
  cacheProfile,
  getCachedProfile,
  cacheBookings,
  getCachedBookings,
  cacheMaids,
  getCachedMaids,

  // Sync queue
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
  clearSyncQueue,

  // Preferences
  savePreference,
  getPreference,
  getAllPreferences,

  // Cleanup
  clearAll: clearAllOfflineData,
  clearExpired: clearExpiredCache,
};

export default offlineStorage;
