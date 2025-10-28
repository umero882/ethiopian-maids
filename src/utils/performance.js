import React from 'react';

// Performance monitoring utilities
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized || typeof window === 'undefined') return;

    // Initialize Web Vitals monitoring
    this.initWebVitals();

    // Initialize resource monitoring
    this.initResourceMonitoring();

    // Initialize user interaction monitoring
    this.initUserInteractionMonitoring();

    this.isInitialized = true;
  }

  initWebVitals() {
    // Monitor Core Web Vitals
    if ('PerformanceObserver' in window) {
      // Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('LCP', lastEntry.startTime);
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.push(lcpObserver);

      // First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.recordMetric('FID', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ type: 'first-input', buffered: true });
      this.observers.push(fidObserver);

      // Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.recordMetric('CLS', clsValue);
          }
        });
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(clsObserver);
    }

    // Monitor navigation timing
    if (performance.getEntriesByType) {
      const navigationEntries = performance.getEntriesByType('navigation');
      const navTiming = navigationEntries && navigationEntries[0];
      if (navTiming) {
        this.recordMetric('TTI', navTiming.domInteractive - navTiming.navigationStart);
        this.recordMetric('DOMContentLoaded', navTiming.domContentLoadedEventEnd - navTiming.navigationStart);
        this.recordMetric('LoadComplete', navTiming.loadEventEnd - navTiming.navigationStart);
      }
    }
  }

  initResourceMonitoring() {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          if (entry.initiatorType === 'script' || entry.initiatorType === 'link') {
            this.recordResourceMetric(entry.name, {
              duration: entry.duration,
              size: entry.transferSize,
              type: entry.initiatorType
            });
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    }
  }

  initUserInteractionMonitoring() {
    // Monitor React re-renders using performance marks
    // Note: Console hijacking removed due to security concerns
    // Use React DevTools Profiler for render monitoring instead
    if (typeof window !== 'undefined') {
      // Monitor user interactions instead
      let clickCount = 0;
      const clickHandler = () => {
        clickCount++;
        this.recordMetric('UserInteractions', clickCount);
      };

      document.addEventListener('click', clickHandler, { passive: true });

      // Store reference for cleanup
      this.eventCleanup = () => {
        document.removeEventListener('click', clickHandler);
      };
    }
  }

  recordMetric(name, value) {
    const timestamp = Date.now();
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name).push({ value, timestamp });

    // Keep only last 50 entries per metric to prevent memory bloat
    const entries = this.metrics.get(name);
    if (entries.length > 50) {
      // Remove oldest entries, keeping only the most recent 50
      this.metrics.set(name, entries.slice(-50));
    }

    // Clean up old metrics older than 10 minutes
    const tenMinutesAgo = timestamp - 600000;
    this.metrics.forEach((values, key) => {
      const recentValues = values.filter(entry => entry.timestamp > tenMinutesAgo);
      if (recentValues.length === 0) {
        this.metrics.delete(key); // Remove empty metrics
      } else {
        this.metrics.set(key, recentValues);
      }
    });
  }

  recordResourceMetric(url, data) {
    const key = `resource_${new URL(url, window.location.origin).pathname}`;
    this.recordMetric(key, data);
  }

  // Method to track custom performance marks
  mark(name) {
    if (performance.mark) {
      performance.mark(name);
    }
    this.recordMetric(`mark_${name}`, performance.now());
  }

  measure(name, startMark, endMark) {
    if (performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name, 'measure')[0];
        if (measure) {
          this.recordMetric(`measure_${name}`, measure.duration);
        }
      } catch (e) {
        console.warn('Performance measure failed:', e);
      }
    }
  }

  // Get performance report
  getReport() {
    const report = {
      timestamp: Date.now(),
      metrics: {},
      summary: {}
    };

    // Process metrics
    this.metrics.forEach((values, key) => {
      const latestValue = values[values.length - 1];
      const avgValue = values.reduce((sum, item) => sum + (typeof item.value === 'number' ? item.value : 0), 0) / values.length;

      report.metrics[key] = {
        current: latestValue ? latestValue.value : null,
        average: avgValue,
        samples: values.length
      };
    });

    // Generate summary
    const lcp = report.metrics.LCP?.current;
    const fid = report.metrics.FID?.current;
    const cls = report.metrics.CLS?.current;

    report.summary = {
      coreWebVitals: {
        lcp: { value: lcp, good: lcp < 2500, needs_improvement: lcp < 4000 },
        fid: { value: fid, good: fid < 100, needs_improvement: fid < 300 },
        cls: { value: cls, good: cls < 0.1, needs_improvement: cls < 0.25 }
      },
      loadingPerformance: {
        tti: report.metrics.TTI?.current,
        domContentLoaded: report.metrics.DOMContentLoaded?.current,
        loadComplete: report.metrics.LoadComplete?.current
      }
    };

    return report;
  }

  // Monitor memory usage
  getMemoryInfo() {
    if (performance.memory) {
      return {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
        usagePercentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100).toFixed(2)
      };
    }
    return null;
  }

  // Send metrics to analytics (mock implementation)
  sendMetrics() {
    const report = this.getReport();
    const memory = this.getMemoryInfo();

    // In a real implementation, send to analytics service

    // Mock sending to analytics endpoint
    if (process.env.NODE_ENV === 'production') {
      // fetch('/api/analytics/performance', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ ...report, memory })
      // }).catch(console.error);
    }
  }

  cleanup() {
    // Disconnect all performance observers
    this.observers.forEach(observer => {
      try {
        if (observer.disconnect) {
          observer.disconnect();
        }
      } catch (e) {
        console.warn('Error disconnecting performance observer:', e);
      }
    });
    this.observers = [];

    // Clean up event listeners
    if (this.eventCleanup) {
      try {
        this.eventCleanup();
      } catch (e) {
        console.warn('Error cleaning up event listeners:', e);
      }
      this.eventCleanup = null;
    }

    // Clear all metrics to prevent memory leaks
    this.metrics.clear();
    this.isInitialized = false;
  }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const [report, setReport] = React.useState(null);

  React.useEffect(() => {
    performanceMonitor.init();

    const interval = setInterval(() => {
      setReport(performanceMonitor.getReport());
    }, 5000); // Update every 5 seconds

    return () => {
      clearInterval(interval);
      performanceMonitor.cleanup();
    };
  }, []);

  return {
    report,
    mark: performanceMonitor.mark.bind(performanceMonitor),
    measure: performanceMonitor.measure.bind(performanceMonitor),
    getMemoryInfo: performanceMonitor.getMemoryInfo.bind(performanceMonitor)
  };
};

export default performanceMonitor;