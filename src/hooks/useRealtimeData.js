import { useState, useEffect, useCallback } from 'react';
import { databaseService } from '@/services/databaseService';
import { supabase } from '@/lib/databaseClient';

/**
 * Custom hook for real-time data subscriptions
 * Provides live updates from Supabase database with automatic cleanup
 */
export const useRealtimeData = (table, filters = {}, options = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);

  const {
    initialLoad = true,
    onInsert,
    onUpdate,
    onDelete,
    transform,
  } = options;

  // Handle real-time changes
  const handleRealtimeChange = useCallback(
    (payload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;


      setData((currentData) => {
        let updatedData = [...currentData];

        switch (eventType) {
          case 'INSERT': {
            const transformedNew = transform ? transform(newRecord) : newRecord;
            updatedData.push(transformedNew);
            if (onInsert) onInsert(transformedNew);
            break;
          }

          case 'UPDATE': {
            const transformedUpdated = transform
              ? transform(newRecord)
              : newRecord;
            const updateIndex = updatedData.findIndex(
              (item) => item.id === newRecord.id
            );
            if (updateIndex !== -1) {
              updatedData[updateIndex] = transformedUpdated;
            }
            if (onUpdate) onUpdate(transformedUpdated, oldRecord);
            break;
          }

          case 'DELETE':
            updatedData = updatedData.filter(
              (item) => item.id !== oldRecord.id
            );
            if (onDelete) onDelete(oldRecord);
            break;

          default:
            console.warn('Unknown real-time event type:', eventType);
        }

        return updatedData;
      });
    },
    [table, transform, onInsert, onUpdate, onDelete]
  );

  // Load initial data
  const loadData = useCallback(async () => {
    if (!initialLoad) return;

    try {
      setLoading(true);
      setError(null);

      let result;
      switch (table) {
        case 'maid_profiles':
          result = await databaseService.getMaidProfiles(filters);
          break;
        default:
          console.warn(`No data loader implemented for table: ${table}`);
          result = { data: [], error: null };
      }

      if (result.error) {
        throw result.error;
      }

      const transformedData =
        transform && result.data ? result.data.map(transform) : result.data;

      setData(transformedData || []);
    } catch (err) {
      console.error(`Error loading ${table} data:`, err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [table, filters, initialLoad, transform]);

  // Set up real-time subscription
  useEffect(() => {
    if (subscription) {
      databaseService.unsubscribe(subscription);
    }

    const newSubscription = databaseService.subscribeTo(
      table,
      handleRealtimeChange,
      filters
    );

    setSubscription(newSubscription);

    return () => {
      if (newSubscription) {
        databaseService.unsubscribe(newSubscription);
      }
    };
  }, [table, handleRealtimeChange, filters, subscription]);

  // Load initial data
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh data manually
  const refresh = useCallback(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    refresh,
    subscription: !!subscription,
  };
};

/**
 * Hook specifically for maid profiles with real-time updates
 */
export const useRealtimeMaidProfiles = (filters = {}) => {
  return useRealtimeData('maid_profiles', filters, {
    transform: (maid) => ({
      ...maid,
      // Add computed fields
      name: maid.full_name,
      country: maid.nationality,
      // Ensure arrays are properly handled
      skills: Array.isArray(maid.skills) ? maid.skills : [],
      languages: Array.isArray(maid.languages) ? maid.languages : [],
      // Add primary image URL if available
      primaryImageUrl:
        maid.maid_images?.find((img) => img.is_primary)?.file_url || null,
    }),
    onInsert: (newMaid) => {
    },
    onUpdate: (updatedMaid) => {
    },
    onDelete: (deletedMaid) => {
    },
  });
};

/**
 * Hook for real-time image updates
 */
export const useRealtimeMaidImages = (maidId) => {
  return useRealtimeData(
    'maid_images',
    { maid_id: `eq.${maidId}` },
    {
      initialLoad: true,
      transform: (image) => ({
        ...image,
        // Add any computed fields for images
        isPrimary: image.is_primary,
        displayOrder: image.display_order,
      }),
    }
  );
};

/**
 * Hook for processed images
 */
export const useRealtimeProcessedImages = (maidId) => {
  return useRealtimeData(
    'processed_images',
    { maid_profile_id: `eq.${maidId}` },
    {
      initialLoad: true,
      onInsert: (_newImage) => {
      },
    }
  );
};

/**
 * Generic hook for any table with basic CRUD operations
 */
export const useRealtimeTable = (
  tableName,
  selectQuery = '*',
  filters = {}
) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // This would need to be implemented in databaseService
        // For now, we'll use a basic approach
        const { data: result, error: queryError } = await supabase
          .from(tableName)
          .select(selectQuery);

        if (queryError) throw queryError;

        setData(result || []);
        setError(null);
      } catch (err) {
        console.error(`Error loading ${tableName}:`, err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Set up real-time subscription
    const subscription = databaseService.subscribeTo(
      tableName,
      (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload;

        setData((currentData) => {
          switch (eventType) {
            case 'INSERT':
              return [...currentData, newRecord];
            case 'UPDATE':
              return currentData.map((item) =>
                item.id === newRecord.id ? newRecord : item
              );
            case 'DELETE':
              return currentData.filter((item) => item.id !== oldRecord.id);
            default:
              return currentData;
          }
        });
      },
      filters
    );

    return () => {
      if (subscription) {
        databaseService.unsubscribe(subscription);
      }
    };
  }, [tableName, selectQuery, filters]);

  return { data, loading, error };
};

export default useRealtimeData;
