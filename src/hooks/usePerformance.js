import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Hook for measuring component render performance
export const useRenderPerformance = (componentName) => {
  const renderCountRef = useRef(0);
  const renderTimesRef = useRef([]);
  const lastRenderTimeRef = useRef(0);

  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      renderCountRef.current += 1;
      renderTimesRef.current.push(renderTime);
      lastRenderTimeRef.current = renderTime;

      // Log performance in development
      if (process.env.NODE_ENV === 'development' && renderTime > 16) {
        console.warn(
          `🐌 Slow render detected in ${componentName}:`,
          `${renderTime.toFixed(2)}ms`,
          `(Renders: ${renderCountRef.current})`
        );
      }
    };
  });

  const getStats = useCallback(() => {
    const times = renderTimesRef.current;
    if (times.length === 0) return null;

    const total = times.reduce((sum, time) => sum + time, 0);
    const average = total / times.length;
    const max = Math.max(...times);
    const min = Math.min(...times);

    return {
      renderCount: renderCountRef.current,
      averageRenderTime: average,
      lastRenderTime: lastRenderTimeRef.current,
      maxRenderTime: max,
      minRenderTime: min,
      totalRenderTime: total,
    };
  }, []);

  return { getStats };
};

// Hook for debouncing expensive operations
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Hook for throttling expensive operations
export const useThrottle = (value, limit) => {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastRun = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRun.current >= limit) {
        setThrottledValue(value);
        lastRun.current = Date.now();
      }
    }, limit - (Date.now() - lastRun.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
};

// Hook for virtual scrolling
export const useVirtualScrolling = (
  items = [],
  containerHeight = 400,
  itemHeight = 50,
  overscan = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef(null);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
      offsetY: (startIndex + index) * itemHeight,
    }));
  }, [items, startIndex, endIndex, itemHeight]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    scrollElementRef,
    visibleItems,
    totalHeight,
    handleScroll,
    startIndex,
    endIndex,
  };
};

// Hook for lazy loading images
export const useLazyLoading = (threshold = 0.1) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.unobserve(img);
        }
      },
      { threshold }
    );

    observer.observe(img);

    return () => {
      observer.unobserve(img);
    };
  }, [threshold]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setIsLoaded(false);
  }, []);

  return {
    imgRef,
    isLoaded,
    isInView,
    handleLoad,
    handleError,
  };
};

// Hook for memoizing expensive calculations
export const useExpensiveCalculation = (calculate, dependencies, shouldRecalculate) => {
  const memoizedValue = useMemo(() => {
    if (shouldRecalculate === false) return null;

    const startTime = performance.now();
    const result = calculate();
    const endTime = performance.now();

    if (process.env.NODE_ENV === 'development') {
      const calculationTime = endTime - startTime;
      if (calculationTime > 5) {
        /* console.log(
          `💭 Expensive calculation took ${calculationTime.toFixed(2)}ms`
        ); */
      }
    }

    return result;
  }, [...dependencies, shouldRecalculate]);

  return memoizedValue;
};

// Hook for managing cache with TTL (Time To Live)
export const useCache = (key, ttl = 300000) => { // 5 minutes default
  const cacheRef = useRef(new Map());

  const set = useCallback((value) => {
    cacheRef.current.set(key, {
      value,
      timestamp: Date.now(),
    });
  }, [key]);

  const get = useCallback(() => {
    const cached = cacheRef.current.get(key);
    if (!cached) return null;

    const age = Date.now() - cached.timestamp;
    if (age > ttl) {
      cacheRef.current.delete(key);
      return null;
    }

    return cached.value;
  }, [key, ttl]);

  const clear = useCallback(() => {
    cacheRef.current.delete(key);
  }, [key]);

  const clearAll = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return { set, get, clear, clearAll };
};

// Hook for monitoring component memory usage
export const useMemoryMonitor = (componentName) => {
  const [memoryInfo, setMemoryInfo] = useState(null);
  const intervalRef = useRef(null);

  const startMonitoring = useCallback(() => {
    if (!('memory' in performance)) {
      console.warn('Memory API not supported');
      return;
    }

    intervalRef.current = setInterval(() => {
      const memory = performance.memory;
      const info = {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
        timestamp: Date.now(),
      };

      setMemoryInfo(info);

      // Warn if memory usage is high
      const usagePercent = (info.used / info.limit) * 100;
      if (usagePercent > 80) {
        console.warn(
          `🚨 High memory usage in ${componentName}: ${usagePercent.toFixed(1)}%`
        );
      }
    }, 5000); // Check every 5 seconds
  }, [componentName]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    memoryInfo,
    startMonitoring,
    stopMonitoring,
  };
};

// Hook for optimizing re-renders
export const useOptimizedCallback = (callback, dependencies) => {
  const callbackRef = useRef(callback);
  const depsRef = useRef(dependencies);

  // Update callback if dependencies changed
  if (!dependencies.every((dep, index) => dep === depsRef.current[index])) {
    callbackRef.current = callback;
    depsRef.current = dependencies;
  }

  return useCallback((...args) => {
    return callbackRef.current(...args);
  }, []);
};

// Hook for batch state updates
export const useBatchedState = (initialState) => {
  const [state, setState] = useState(initialState);
  const pendingUpdatesRef = useRef([]);
  const timeoutRef = useRef(null);

  const batchedSetState = useCallback((update) => {
    pendingUpdatesRef.current.push(update);

    if (timeoutRef.current) return;

    timeoutRef.current = setTimeout(() => {
      setState(currentState => {
        const updates = pendingUpdatesRef.current;
        pendingUpdatesRef.current = [];

        return updates.reduce((acc, update) => {
          return typeof update === 'function' ? update(acc) : update;
        }, currentState);
      });

      timeoutRef.current = null;
    }, 0);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [state, batchedSetState];
};

// Hook for preventing memory leaks
export const useCleanup = () => {
  const cleanupFunctionsRef = useRef([]);

  const addCleanup = useCallback((cleanupFn) => {
    cleanupFunctionsRef.current.push(cleanupFn);
  }, []);

  const cleanup = useCallback(() => {
    cleanupFunctionsRef.current.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.error('Cleanup function error:', error);
      }
    });
    cleanupFunctionsRef.current = [];
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { addCleanup, cleanup };
};

// Hook for lazy loading components
export const useLazyComponent = (importFunc, fallback = null) => {
  const [Component, setComponent] = useState(() => fallback);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadComponent = useCallback(async () => {
    if (Component && Component !== fallback) return;

    setLoading(true);
    setError(null);

    try {
      const module = await importFunc();
      const ImportedComponent = module.default || module;
      setComponent(() => ImportedComponent);
    } catch (err) {
      setError(err);
      console.error('Failed to load component:', err);
    } finally {
      setLoading(false);
    }
  }, [Component, fallback, importFunc]);

  return {
    Component,
    loading,
    error,
    loadComponent,
  };
};

// Hook for request deduplication
export const useRequestDeduplication = () => {
  const requestCacheRef = useRef(new Map());

  const deduplicate = useCallback(async (key, requestFn) => {
    // If request is already in progress, return the existing promise
    if (requestCacheRef.current.has(key)) {
      return requestCacheRef.current.get(key);
    }

    // Create new request
    const requestPromise = requestFn().finally(() => {
      // Remove from cache when request completes
      requestCacheRef.current.delete(key);
    });

    requestCacheRef.current.set(key, requestPromise);
    return requestPromise;
  }, []);

  const clearCache = useCallback(() => {
    requestCacheRef.current.clear();
  }, []);

  return { deduplicate, clearCache };
};

// Performance monitoring utility
export const usePerformanceObserver = (entryTypes = ['measure', 'navigation']) => {
  const [entries, setEntries] = useState([]);
  const observerRef = useRef(null);

  useEffect(() => {
    if (!('PerformanceObserver' in window)) return;

    observerRef.current = new PerformanceObserver((list) => {
      const newEntries = list.getEntries();
      setEntries(prev => [...prev, ...newEntries]);
    });

    observerRef.current.observe({ entryTypes });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [entryTypes]);

  const clearEntries = useCallback(() => {
    setEntries([]);
  }, []);

  return {
    entries,
    clearEntries,
  };
};