/**
 * 🔄 Unified Async Operation Hook
 * Standardizes loading states, error handling, and success feedback
 */

import { useState, useCallback, useRef } from 'react';
import { handleError } from '@/services/centralizedErrorHandler';
import { toast } from '@/components/ui/use-toast';

export const useAsyncOperation = (options = {}) => {
  const {
    showSuccessToast = true,
    showErrorToast = true,
    successMessage = 'Operation completed successfully',
    onSuccess,
    onError,
    context = {},
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const abortControllerRef = useRef(null);

  const execute = useCallback(
    async (asyncFunction, ...args) => {
      // Cancel previous operation if still running
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      setLoading(true);
      setError(null);

      try {
        // Execute the async function with abort signal
        const result = await asyncFunction(signal, ...args);

        // Check if operation was aborted
        if (signal.aborted) {
          return null;
        }

        setData(result);

        // Show success feedback
        if (showSuccessToast) {
          toast({
            title: 'Success',
            description: successMessage,
            variant: 'default',
          });
        }

        // Call success callback
        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err) {
        // Don't handle aborted operations
        if (err.name === 'AbortError' || signal.aborted) {
          return null;
        }

        setError(err);

        // Handle error through centralized handler
        if (showErrorToast) {
          await handleError(err, context);
        }

        // Call error callback
        if (onError) {
          onError(err);
        }

        throw err;
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [
      showSuccessToast,
      showErrorToast,
      successMessage,
      onSuccess,
      onError,
      context,
    ]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLoading(false);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset,
    cancel,
    isIdle: !loading && !error && !data,
  };
};

// Specialized hooks for common operations
export const useApiCall = (options = {}) => {
  return useAsyncOperation({
    context: { component: 'api' },
    ...options,
  });
};

export const useFormSubmission = (options = {}) => {
  return useAsyncOperation({
    successMessage: 'Form submitted successfully',
    context: { component: 'form' },
    ...options,
  });
};

export const useFileUpload = (options = {}) => {
  return useAsyncOperation({
    successMessage: 'File uploaded successfully',
    context: { component: 'upload' },
    ...options,
  });
};

export const useDataFetch = (options = {}) => {
  return useAsyncOperation({
    showSuccessToast: false, // Don't show toast for data fetching
    context: { component: 'fetch' },
    ...options,
  });
};

// Hook for operations that need confirmation
export const useConfirmedOperation = (options = {}) => {
  const {
    confirmationTitle = 'Confirm Action',
    confirmationMessage = 'Are you sure you want to proceed?',
    ...asyncOptions
  } = options;

  const asyncOp = useAsyncOperation(asyncOptions);

  const executeWithConfirmation = useCallback(
    async (asyncFunction, ...args) => {
      const confirmed = window.confirm(
        `${confirmationTitle}\n\n${confirmationMessage}`
      );

      if (!confirmed) {
        return null;
      }

      return asyncOp.execute(asyncFunction, ...args);
    },
    [asyncOp.execute, confirmationTitle, confirmationMessage]
  );

  return {
    ...asyncOp,
    execute: executeWithConfirmation,
  };
};

// Hook for retry logic
export const useRetryableOperation = (options = {}) => {
  const { maxRetries = 3, retryDelay = 1000, ...asyncOptions } = options;

  const [retryCount, setRetryCount] = useState(0);
  const asyncOp = useAsyncOperation(asyncOptions);

  const executeWithRetry = useCallback(
    async (asyncFunction, ...args) => {
      let lastError;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          setRetryCount(attempt);
          return await asyncOp.execute(asyncFunction, ...args);
        } catch (error) {
          lastError = error;

          if (attempt < maxRetries) {
            // Wait before retry
            await new Promise((resolve) =>
              setTimeout(resolve, retryDelay * (attempt + 1))
            );
          }
        }
      }

      throw lastError;
    },
    [asyncOp.execute, maxRetries, retryDelay]
  );

  return {
    ...asyncOp,
    execute: executeWithRetry,
    retryCount,
    maxRetries,
  };
};

// Hook for debounced operations (useful for search)
export const useDebouncedOperation = (options = {}) => {
  const { delay = 300, ...asyncOptions } = options;
  const asyncOp = useAsyncOperation(asyncOptions);
  const timeoutRef = useRef(null);

  const executeDebounced = useCallback(
    (asyncFunction, ...args) => {
      // Clear previous timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        asyncOp.execute(asyncFunction, ...args);
      }, delay);
    },
    [asyncOp.execute, delay]
  );

  const executeImmediate = useCallback(
    (asyncFunction, ...args) => {
      // Clear any pending debounced execution
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      return asyncOp.execute(asyncFunction, ...args);
    },
    [asyncOp.execute]
  );

  return {
    ...asyncOp,
    execute: executeDebounced,
    executeImmediate,
  };
};
