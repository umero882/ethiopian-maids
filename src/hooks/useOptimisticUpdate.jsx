import { useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

/**
 * useOptimisticUpdate Hook
 * Provides optimistic UI updates with automatic rollback on error
 *
 * Usage:
 * const { data, update, isUpdating } = useOptimisticUpdate(initialData);
 *
 * update(newData, async () => {
 *   await api.updateProfile(newData);
 * });
 */
export function useOptimisticUpdate(initialData, options = {}) {
  const {
    onSuccess,
    onError,
    successMessage = 'Updated successfully',
    errorMessage = 'Failed to update',
    showToast = true,
  } = options;

  const [data, setData] = useState(initialData);
  const [previousData, setPreviousData] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Perform an optimistic update
   * @param {*} newData - The new data to optimistically apply
   * @param {Function} updateFn - Async function that performs the actual update
   */
  const update = useCallback(async (newData, updateFn) => {
    try {
      // Save current data for potential rollback
      setPreviousData(data);

      // Optimistically update the UI
      setData(newData);
      setIsUpdating(true);
      setError(null);

      // Perform the actual update
      const result = await updateFn(newData);

      // Success
      if (showToast) {
        toast({
          title: 'Success',
          description: successMessage,
        });
      }

      if (onSuccess) {
        onSuccess(result);
      }

      // Clear previous data since update was successful
      setPreviousData(null);

      return { success: true, data: result };

    } catch (err) {
      // Rollback on error
      setData(previousData || data);
      setError(err);

      if (showToast) {
        toast({
          title: 'Error',
          description: err.message || errorMessage,
          variant: 'destructive',
        });
      }

      if (onError) {
        onError(err);
      }

      return { success: false, error: err };

    } finally {
      setIsUpdating(false);
    }
  }, [data, previousData, onSuccess, onError, successMessage, errorMessage, showToast]);

  /**
   * Manually rollback to previous data
   */
  const rollback = useCallback(() => {
    if (previousData) {
      setData(previousData);
      setPreviousData(null);
    }
  }, [previousData]);

  /**
   * Reset to initial data
   */
  const reset = useCallback(() => {
    setData(initialData);
    setPreviousData(null);
    setError(null);
  }, [initialData]);

  return {
    data,
    isUpdating,
    error,
    update,
    rollback,
    reset,
    setData,
  };
}

/**
 * useOptimisticList Hook
 * Optimistic updates for list operations (add, remove, update item)
 */
export function useOptimisticList(initialList = [], options = {}) {
  const {
    onSuccess,
    onError,
    showToast = true,
  } = options;

  const [list, setList] = useState(initialList);
  const [previousList, setPreviousList] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  /**
   * Add item to list optimistically
   */
  const addItem = useCallback(async (newItem, addFn) => {
    try {
      setPreviousList(list);
      setList([...list, newItem]);
      setIsUpdating(true);

      const result = await addFn(newItem);

      if (showToast) {
        toast({ title: 'Success', description: 'Item added successfully' });
      }

      if (onSuccess) {
        onSuccess(result);
      }

      setPreviousList(null);
      return { success: true, data: result };

    } catch (err) {
      setList(previousList || list);

      if (showToast) {
        toast({
          title: 'Error',
          description: err.message || 'Failed to add item',
          variant: 'destructive',
        });
      }

      if (onError) {
        onError(err);
      }

      return { success: false, error: err };

    } finally {
      setIsUpdating(false);
    }
  }, [list, previousList, onSuccess, onError, showToast]);

  /**
   * Remove item from list optimistically
   */
  const removeItem = useCallback(async (itemId, removeFn) => {
    try {
      setPreviousList(list);
      setList(list.filter(item => item.id !== itemId));
      setIsUpdating(true);

      const result = await removeFn(itemId);

      if (showToast) {
        toast({ title: 'Success', description: 'Item removed successfully' });
      }

      if (onSuccess) {
        onSuccess(result);
      }

      setPreviousList(null);
      return { success: true, data: result };

    } catch (err) {
      setList(previousList || list);

      if (showToast) {
        toast({
          title: 'Error',
          description: err.message || 'Failed to remove item',
          variant: 'destructive',
        });
      }

      if (onError) {
        onError(err);
      }

      return { success: false, error: err };

    } finally {
      setIsUpdating(false);
    }
  }, [list, previousList, onSuccess, onError, showToast]);

  /**
   * Update item in list optimistically
   */
  const updateItem = useCallback(async (itemId, updatedData, updateFn) => {
    try {
      setPreviousList(list);
      setList(list.map(item =>
        item.id === itemId ? { ...item, ...updatedData } : item
      ));
      setIsUpdating(true);

      const result = await updateFn(itemId, updatedData);

      if (showToast) {
        toast({ title: 'Success', description: 'Item updated successfully' });
      }

      if (onSuccess) {
        onSuccess(result);
      }

      setPreviousList(null);
      return { success: true, data: result };

    } catch (err) {
      setList(previousList || list);

      if (showToast) {
        toast({
          title: 'Error',
          description: err.message || 'Failed to update item',
          variant: 'destructive',
        });
      }

      if (onError) {
        onError(err);
      }

      return { success: false, error: err };

    } finally {
      setIsUpdating(false);
    }
  }, [list, previousList, onSuccess, onError, showToast]);

  return {
    list,
    isUpdating,
    addItem,
    removeItem,
    updateItem,
    setList,
  };
}

export default useOptimisticUpdate;
