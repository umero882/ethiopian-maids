/**
 * ⚡ Performance Optimizer
 * Bundle analysis, code splitting, and performance monitoring
 */

import { lazy, Suspense } from 'react';
import { LoadingSpinner } from '@/components/LoadingStates';

// =============================================
// DYNAMIC IMPORTS & CODE SPLITTING
// =============================================

// Lazy load heavy components
export const LazyComponents = {
  // Dashboard components (heavy)
  MaidDashboard: lazy(() => import('@/pages/dashboards/MaidDashboard')),
  SponsorDashboard: lazy(() => import('@/pages/dashboards/SponsorDashboard')),
  AgencyDashboard: lazy(() => import('@/pages/dashboards/AgencyDashboard')),
  AdminDashboard: lazy(() => import('@/pages/AdminDashboard')),

  // Feature-heavy components (commented out non-existent components)
  // Chat: lazy(() => import('@/pages/Chat')),
  // VideoCall: lazy(() => import('@/components/chat/VideoCall')),
  // FileUpload: lazy(() => import('@/components/shared/FileUpload')),
  // ImageEditor: lazy(() => import('@/components/shared/ImageEditor')),

  // Charts and analytics (heavy libraries) - commented out non-existent components
  // Analytics: lazy(() => import('@/components/dashboard/Analytics')),
  // Charts: lazy(() => import('@/components/dashboard/Charts')),

  // Less frequently used pages - commented out non-existent components
  // PricingPage: lazy(() => import('@/pages/PricingPage')),
  // Blog: lazy(() => import('@/pages/Blog')),

  // Admin tools - commented out non-existent components
  // DatabaseMigrationTool: lazy(() => import('@/components/DataMigrationTool')),
  // SystemDiagnostics: lazy(() => import('@/components/SystemDiagnostics')),
};

// Higher-order component for lazy loading with error boundary
export const withLazyLoading = (Component, fallback) => {
  return (props) => {
    const React = require('react');
    const { Suspense } = React;

    const defaultFallback =
      fallback ||
      React.createElement(
        'div',
        { className: 'loading-spinner' },
        'Loading...'
      );

    return React.createElement(
      Suspense,
      { fallback: defaultFallback },
      React.createElement(Component, props)
    );
  };
};

// =============================================
// BUNDLE ANALYSIS UTILITIES
// =============================================

export const BundleAnalyzer = {
  // Analyze which components are loaded
  trackComponentLoad: (componentName) => {
    if (process.env.NODE_ENV === 'development') {
    }
  },

  // Track bundle chunks
  trackChunkLoad: (chunkName) => {
    if (process.env.NODE_ENV === 'development') {
    }
  },

  // Get bundle size information
  getBundleInfo: () => {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0];
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded:
          navigation.domContentLoadedEventEnd -
          navigation.domContentLoadedEventStart,
        transferSize: navigation.transferSize,
        encodedBodySize: navigation.encodedBodySize,
      };
    }
    return null;
  },
};

// =============================================
// PERFORMANCE MONITORING
// =============================================

export class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.isEnabled = process.env.NODE_ENV === 'production';
  }

  // Start timing an operation
  startTiming(label) {
    if (!this.isEnabled) return;

    this.metrics.set(label, {
      startTime: performance.now(),
      endTime: null,
      duration: null,
    });
  }

  // End timing an operation
  endTiming(label) {
    if (!this.isEnabled) return;

    const metric = this.metrics.get(label);
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;

      // Log slow operations
      if (metric.duration > 1000) {
        console.warn(
          `⚠️ Slow operation: ${label} took ${metric.duration.toFixed(2)}ms`
        );
      }
    }
  }

  // Monitor component render times
  monitorComponent(componentName, renderFunction) {
    if (!this.isEnabled) return renderFunction();

    this.startTiming(`render_${componentName}`);
    const result = renderFunction();
    this.endTiming(`render_${componentName}`);

    return result;
  }

  // Monitor API calls
  monitorApiCall(apiName, apiFunction) {
    if (!this.isEnabled) return apiFunction();

    this.startTiming(`api_${apiName}`);

    if (apiFunction.then) {
      // Handle promises
      return apiFunction()
        .then((result) => {
          this.endTiming(`api_${apiName}`);
          return result;
        })
        .catch((error) => {
          this.endTiming(`api_${apiName}`);
          throw error;
        });
    } else {
      // Handle synchronous functions
      const result = apiFunction();
      this.endTiming(`api_${apiName}`);
      return result;
    }
  }

  // Monitor page load times
  monitorPageLoad() {
    if (!this.isEnabled || typeof window === 'undefined') return;

    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const metrics = {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        request: navigation.responseStart - navigation.requestStart,
        response: navigation.responseEnd - navigation.responseStart,
        dom:
          navigation.domContentLoadedEventEnd -
          navigation.domContentLoadedEventStart,
        load: navigation.loadEventEnd - navigation.loadEventStart,
        total: navigation.loadEventEnd - navigation.navigationStart,
      };


      // Send to analytics if needed
      this.sendMetrics('page_load', metrics);
    });
  }

  // Monitor Core Web Vitals
  monitorWebVitals() {
    if (!this.isEnabled || typeof window === 'undefined') return;

    // Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.sendMetrics('lcp', { value: lastEntry.startTime });
      });

      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.set('lcp', lcpObserver);

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.sendMetrics('fid', {
            value: entry.processingStart - entry.startTime,
          });
        });
      });

      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.set('fid', fidObserver);
    }
  }

  // Send metrics to analytics service
  sendMetrics(type, data) {
    // Implement your analytics service here
    // Example: Google Analytics, Mixpanel, etc.
    if (process.env.NODE_ENV === 'development') {
    }
  }

  // Get all collected metrics
  getMetrics() {
    const result = {};
    this.metrics.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  // Clean up observers
  cleanup() {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
    this.metrics.clear();
  }
}

// =============================================
// RESOURCE OPTIMIZATION
// =============================================

export const ResourceOptimizer = {
  // Preload critical resources
  preloadCriticalResources: () => {
    const criticalResources = [
      '/images/new-ethiopian-maids-logo.svg',
      '/fonts/inter-var.woff2',
    ];

    criticalResources.forEach((resource) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = resource.includes('.woff') ? 'font' : 'image';
      if (link.as === 'font') link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  },

  // Lazy load images
  lazyLoadImages: () => {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });

      document.querySelectorAll('img[data-src]').forEach((img) => {
        imageObserver.observe(img);
      });
    }
  },

  // Optimize images
  optimizeImage: (file, maxWidth = 800, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(resolve, 'image/jpeg', quality);
      };

      img.src = URL.createObjectURL(file);
    });
  },

  // Prefetch next page resources
  prefetchNextPage: (nextRoute) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = nextRoute;
    document.head.appendChild(link);
  },
};

// =============================================
// MEMORY MANAGEMENT
// =============================================

export const MemoryManager = {
  // Clean up unused resources
  cleanup: () => {
    // Clear caches
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          if (name.includes('old') || name.includes('temp')) {
            caches.delete(name);
          }
        });
      });
    }

    // Force garbage collection in development
    if (process.env.NODE_ENV === 'development' && window.gc) {
      window.gc();
    }
  },

  // Monitor memory usage
  monitorMemory: () => {
    if ('memory' in performance) {
      const memory = performance.memory;
      /* console.log('📊 Memory Usage:', {
        used: Math.round(memory.usedJSHeapSize / 1048576) + ' MB',
        total: Math.round(memory.totalJSHeapSize / 1048576) + ' MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) + ' MB',
      }); */

      // Warn if memory usage is high
      if (memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8) {
        console.warn('⚠️ High memory usage detected');
      }
    }
  },
};

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Initialize performance monitoring
export const initializePerformanceMonitoring = () => {
  performanceMonitor.monitorPageLoad();
  performanceMonitor.monitorWebVitals();
  ResourceOptimizer.preloadCriticalResources();

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    performanceMonitor.cleanup();
    MemoryManager.cleanup();
  });
};
