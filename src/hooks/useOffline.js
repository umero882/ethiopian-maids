/**
 * Offline Status Hook
 * Provides offline detection, sync queue management, and network status
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import offlineStorage from '@/lib/offlineStorage';
import { toast } from '@/components/ui/use-toast';

export const useOffline = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncInProgress, setSyncInProgress] = useState(false);
  const [pendingActions, setPendingActions] = useState([]);
  const syncIntervalRef = useRef(null);

  // Update online status
  const handleOnline = useCallback(() => {
    setIsOnline(true);
    toast({
      title: 'Back Online',
      description: 'Connection restored. Syncing pending changes...',
      duration: 3000,
    });
    // Trigger sync
    syncPendingActions();
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    toast({
      title: 'Offline Mode',
      description: 'You are offline. Changes will be saved and synced when online.',
      variant: 'warning',
      duration: 5000,
    });
  }, []);

  // Load pending actions
  const loadPendingActions = useCallback(async () => {
    try {
      const actions = await offlineStorage.getPendingActions();
      setPendingActions(actions);
      return actions;
    } catch (error) {
      console.error('Failed to load pending actions:', error);
      return [];
    }
  }, []);

  // Sync pending actions
  const syncPendingActions = useCallback(async () => {
    if (!navigator.onLine || syncInProgress) return;

    try {
      setSyncInProgress(true);
      const actions = await offlineStorage.getPendingActions();

      if (actions.length === 0) {
        setSyncInProgress(false);
        return;
      }


      let successCount = 0;
      let failCount = 0;

      for (const action of actions) {
        try {
          // Perform the action
          const response = await fetch(action.url, {
            method: action.method || 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...action.headers,
            },
            body: action.body ? JSON.stringify(action.body) : undefined,
          });

          if (response.ok) {
            // Remove from queue
            await offlineStorage.removePendingAction(action.id);
            successCount++;
          } else {
            // Update retry count
            await offlineStorage.updatePendingActionStatus(
              action.id,
              'failed',
              await response.text()
            );
            failCount++;
          }
        } catch (error) {
          console.error('Failed to sync action:', error);
          await offlineStorage.updatePendingActionStatus(
            action.id,
            'failed',
            error.message
          );
          failCount++;
        }
      }

      // Reload pending actions
      await loadPendingActions();

      // Show result
      if (successCount > 0) {
        toast({
          title: 'Sync Complete',
          description: `${successCount} action(s) synced successfully${failCount > 0 ? `, ${failCount} failed` : ''}.`,
        });
      }

      // Register background sync if available
      if ('serviceWorker' in navigator && 'sync' in self.registration) {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('sync-pending-actions');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: 'Sync Failed',
        description: 'Failed to sync pending actions. Will retry later.',
        variant: 'destructive',
      });
    } finally {
      setSyncInProgress(false);
    }
  }, [syncInProgress, loadPendingActions]);

  // Add action to queue
  const queueAction = useCallback(async (action) => {
    try {
      await offlineStorage.addPendingAction(action);
      await loadPendingActions();

      toast({
        title: 'Action Queued',
        description: 'Your action will be synced when you\'re back online.',
        duration: 3000,
      });

      // Try to sync immediately if online
      if (navigator.onLine) {
        setTimeout(syncPendingActions, 1000);
      }
    } catch (error) {
      console.error('Failed to queue action:', error);
      toast({
        title: 'Error',
        description: 'Failed to save action for offline sync.',
        variant: 'destructive',
      });
    }
  }, [loadPendingActions, syncPendingActions]);

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial load
    loadPendingActions();

    // Set up periodic sync check (every 30 seconds)
    syncIntervalRef.current = setInterval(() => {
      if (navigator.onLine && pendingActions.length > 0) {
        syncPendingActions();
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [handleOnline, handleOffline, loadPendingActions, syncPendingActions, pendingActions.length]);

  return {
    isOnline,
    isOffline: !isOnline,
    syncInProgress,
    pendingActions,
    pendingCount: pendingActions.length,
    queueAction,
    syncNow: syncPendingActions,
    refreshQueue: loadPendingActions,
  };
};

/**
 * Offline-aware fetch wrapper
 */
export const useOfflineFetch = () => {
  const { isOnline, queueAction } = useOffline();

  const offlineFetch = useCallback(async (url, options = {}) => {
    const {
      cache = true,
      cacheKey,
      fallbackData,
      queueOnOffline = true,
      ...fetchOptions
    } = options;

    try {
      // Try to fetch from network
      const response = await fetch(url, fetchOptions);

      if (response.ok) {
        const data = await response.json();

        // Cache the response if requested
        if (cache && cacheKey) {
          // Store in appropriate cache based on type
          // This would integrate with offlineStorage
        }

        return { data, fromCache: false, error: null };
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.error('Fetch error:', error);

      // If offline and method is not GET, queue the action
      if (!isOnline && queueOnOffline && fetchOptions.method !== 'GET') {
        await queueAction({
          url,
          method: fetchOptions.method || 'GET',
          headers: fetchOptions.headers,
          body: fetchOptions.body,
          type: 'api-request',
        });

        return {
          data: null,
          fromCache: false,
          error: 'Queued for later sync',
          queued: true,
        };
      }

      // Try to get from cache if available
      if (cache && cacheKey) {
        // Attempt to retrieve from offline storage
        // This is a simplified example
        try {
          const cachedData = await offlineStorage.getPreference(cacheKey);
          if (cachedData) {
            return {
              data: cachedData,
              fromCache: true,
              error: 'Using cached data',
            };
          }
        } catch (cacheError) {
          console.error('Cache retrieval failed:', cacheError);
        }
      }

      // Return fallback data if provided
      if (fallbackData) {
        return {
          data: fallbackData,
          fromCache: false,
          error: error.message,
        };
      }

      return {
        data: null,
        fromCache: false,
        error: error.message,
      };
    }
  }, [isOnline, queueAction]);

  return { offlineFetch, isOnline };
};

export default useOffline;
