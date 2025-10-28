// Service Worker Cleanup Script
// Handles cleanup of old service worker registrations and cache issues

(function() {
  'use strict';

  // Only run in browsers that support service workers
  if ('serviceWorker' in navigator) {

    // Function to unregister all service workers
    function unregisterAllServiceWorkers() {
      return navigator.serviceWorker.getRegistrations()
        .then(function(registrations) {
          const promises = registrations.map(function(registration) {
            console.log('Unregistering service worker:', registration.scope);
            return registration.unregister();
          });
          return Promise.all(promises);
        })
        .catch(function(error) {
          console.warn('Error unregistering service workers:', error);
        });
    }

    // Function to clear all caches
    function clearAllCaches() {
      if ('caches' in window) {
        return caches.keys()
          .then(function(cacheNames) {
            const promises = cacheNames.map(function(cacheName) {
              console.log('Deleting cache:', cacheName);
              return caches.delete(cacheName);
            });
            return Promise.all(promises);
          })
          .catch(function(error) {
            console.warn('Error clearing caches:', error);
          });
      }
      return Promise.resolve();
    }

    // Main cleanup function
    function cleanup() {
      return Promise.all([
        unregisterAllServiceWorkers(),
        clearAllCaches()
      ])
      .then(function() {
        console.log('🧹 Service worker and cache cleanup completed');
      })
      .catch(function(error) {
        console.warn('⚠️ Cleanup error:', error);
      });
    }

    // Auto-cleanup on page load (only if there are existing registrations)
    navigator.serviceWorker.getRegistrations()
      .then(function(registrations) {
        if (registrations.length > 0) {
          console.log('🧹 Cleaning up old service worker registrations...');
          cleanup();
        }
      });

    // Expose cleanup function globally for manual triggering
    window.cleanupServiceWorkers = cleanup;
  }
})();