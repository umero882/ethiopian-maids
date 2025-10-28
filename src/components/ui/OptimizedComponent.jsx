/**
 * Performance-optimized wrapper for expensive React components
 * Provides memoization, lazy loading, and performance monitoring
 */

import React, { memo, useMemo, useCallback, Suspense, lazy } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

/**
 * Higher-order component for performance optimization
 */
export const withPerformanceOptimization = (Component, options = {}) => {
  const {
    displayName = Component.displayName || Component.name || 'Component',
    shouldMemoize = true,
    errorFallback = null,
    loadingFallback = <div className="animate-pulse bg-gray-200 rounded h-20" />,
  } = options;

  const OptimizedComponent = memo((props) => {
    // Memoize expensive computations
    const memoizedProps = useMemo(() => {
      const { children, ...restProps } = props;
      return {
        ...restProps,
        children: React.Children.count(children) > 0 ? children : undefined,
      };
    }, [props]);

    return (
      <ErrorBoundary
        fallback={errorFallback || <div className="text-red-500">Error loading {displayName}</div>}
        onError={(error) => {
          console.error(`Error in ${displayName}:`, error);
        }}
      >
        <Suspense fallback={loadingFallback}>
          <Component {...memoizedProps} />
        </Suspense>
      </ErrorBoundary>
    );
  });

  OptimizedComponent.displayName = `Optimized(${displayName})`;
  return OptimizedComponent;
};

/**
 * Hook for optimizing expensive computations
 */
export const useExpensiveComputation = (computeFn, deps, options = {}) => {
  const { enabled = true, fallback = null } = options;

  return useMemo(() => {
    if (!enabled) return fallback;

    const startTime = performance.now();
    const result = computeFn();
    const endTime = performance.now();

    // Log if computation takes longer than 50ms
    if (endTime - startTime > 50) {
      console.warn(`Expensive computation took ${endTime - startTime}ms`);
    }

    return result;
  }, deps);
};

/**
 * Hook for optimizing event handlers
 */
export const useOptimizedCallback = (callback, deps) => {
  return useCallback(callback, deps);
};

/**
 * Lazy loading wrapper with better error handling
 */
export const createLazyComponent = (importFn, options = {}) => {
  const {
    loadingComponent = <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />,
    errorComponent = <div className="text-red-500">Failed to load component</div>,
    retryCount = 3,
  } = options;

  const LazyComponent = lazy(() => {
    let attempts = 0;

    const loadWithRetry = async () => {
      try {
        return await importFn();
      } catch (error) {
        attempts++;
        if (attempts < retryCount) {
          console.warn(`Component load failed, retrying... (${attempts}/${retryCount})`);
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
          return loadWithRetry();
        }
        throw error;
      }
    };

    return loadWithRetry();
  });

  return (props) => (
    <ErrorBoundary fallback={errorComponent}>
      <Suspense fallback={loadingComponent}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * Performance monitoring hook
 */
export const usePerformanceMonitor = (componentName) => {
  const startTime = useMemo(() => performance.now(), []);

  React.useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    if (renderTime > 100) {
      console.warn(`${componentName} took ${renderTime}ms to render`);
    }
  });

  const measureAction = useCallback((actionName, actionFn) => {
    return (...args) => {
      const actionStart = performance.now();
      const result = actionFn(...args);
      const actionEnd = performance.now();

      if (actionEnd - actionStart > 50) {
        console.warn(`${componentName}.${actionName} took ${actionEnd - actionStart}ms`);
      }

      return result;
    };
  }, [componentName]);

  return { measureAction };
};

export default {
  withPerformanceOptimization,
  useExpensiveComputation,
  useOptimizedCallback,
  createLazyComponent,
  usePerformanceMonitor,
};