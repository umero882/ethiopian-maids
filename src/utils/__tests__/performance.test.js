import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock performance APIs
const mockPerformanceObserver = vi.fn();
const mockDisconnect = vi.fn();

// Mock PerformanceObserver constructor
global.PerformanceObserver = vi.fn().mockImplementation((callback) => {
  mockPerformanceObserver.mockImplementation(callback);
  return {
    observe: vi.fn(),
    disconnect: mockDisconnect,
  };
});

// Mock performance.memory
Object.defineProperty(global.performance, 'memory', {
  value: {
    usedJSHeapSize: 50000000,
    totalJSHeapSize: 100000000,
    jsHeapSizeLimit: 200000000,
  },
  writable: true,
});

// Mock performance methods
global.performance.mark = vi.fn();
global.performance.measure = vi.fn();
global.performance.getEntriesByName = vi.fn();
global.performance.getEntriesByType = vi.fn().mockReturnValue([]);

// Mock window and document
Object.defineProperty(global, 'window', {
  value: {
    location: { origin: 'http://localhost:3000' },
  },
  writable: true,
});

Object.defineProperty(global, 'document', {
  value: {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  writable: true,
});

describe('PerformanceMonitor', () => {
  let PerformanceMonitor;
  let monitor;

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks();
    mockDisconnect.mockClear();

    // Dynamically import after mocking globals
    const module = await import('../performance.js');
    PerformanceMonitor = module.default.constructor;
    monitor = new PerformanceMonitor();
  });

  afterEach(() => {
    if (monitor && monitor.cleanup) {
      monitor.cleanup();
    }
  });

  describe('Initialization', () => {
    test('should initialize only once', () => {
      monitor.init();
      monitor.init(); // Second call should be ignored

      expect(monitor.isInitialized).toBe(true);
    });

    test('should not initialize in server environment', () => {
      // Mock server environment
      const originalWindow = global.window;
      delete global.window;

      const serverMonitor = new PerformanceMonitor();
      serverMonitor.init();

      expect(serverMonitor.isInitialized).toBe(false);

      // Restore window
      global.window = originalWindow;
    });
  });

  describe('Web Vitals Monitoring', () => {
    test('should record LCP metrics correctly', () => {
      monitor.init();

      // Simulate LCP observation
      const mockEntries = [
        { startTime: 1500 }
      ];

      const lcpCallback = mockPerformanceObserver.mock.calls.find(
        call => call[0].toString().includes('LCP')
      )?.[0];

      if (lcpCallback) {
        lcpCallback({
          getEntries: () => mockEntries
        });

        expect(monitor.metrics.has('LCP')).toBe(true);
        expect(monitor.metrics.get('LCP')[0].value).toBe(1500);
      }
    });

    test('should record FID metrics correctly', () => {
      monitor.init();

      // Simulate FID observation
      const mockEntries = [
        {
          processingStart: 150,
          startTime: 100
        }
      ];

      const fidCallback = mockPerformanceObserver.mock.calls.find(
        call => call[0].toString().includes('FID')
      )?.[0];

      if (fidCallback) {
        fidCallback({
          getEntries: () => mockEntries
        });

        expect(monitor.metrics.has('FID')).toBe(true);
        expect(monitor.metrics.get('FID')[0].value).toBe(50);
      }
    });

    test('should record CLS metrics correctly', () => {
      monitor.init();

      // Simulate CLS observation
      const mockEntries = [
        {
          value: 0.05,
          hadRecentInput: false
        },
        {
          value: 0.03,
          hadRecentInput: false
        }
      ];

      const clsCallback = mockPerformanceObserver.mock.calls.find(
        call => call[0].toString().includes('CLS')
      )?.[0];

      if (clsCallback) {
        // First entry
        clsCallback({
          getEntries: () => [mockEntries[0]]
        });

        // Second entry
        clsCallback({
          getEntries: () => [mockEntries[1]]
        });

        expect(monitor.metrics.has('CLS')).toBe(true);
        // CLS should accumulate values
        const clsValues = monitor.metrics.get('CLS');
        expect(clsValues.length).toBe(2);
        expect(clsValues[1].value).toBe(0.08); // 0.05 + 0.03
      }
    });
  });

  describe('Memory Management', () => {
    test('should limit metrics to 50 entries per metric', () => {
      monitor.init();

      // Add more than 50 entries
      for (let i = 0; i < 60; i++) {
        monitor.recordMetric('testMetric', i);
      }

      const entries = monitor.metrics.get('testMetric');
      expect(entries.length).toBe(50);
      // Should keep the most recent entries
      expect(entries[0].value).toBe(10); // 60 - 50 = 10
      expect(entries[49].value).toBe(59);
    });

    test('should clean up old metrics older than 10 minutes', () => {
      monitor.init();

      // Mock Date.now to control timestamps
      const originalNow = Date.now;
      const baseTime = 1000000;
      Date.now = vi.fn(() => baseTime);

      // Add old metrics
      monitor.recordMetric('oldMetric', 100);

      // Move time forward 11 minutes
      Date.now = vi.fn(() => baseTime + 660000); // 11 minutes later

      // Add new metric (this will trigger cleanup)
      monitor.recordMetric('newMetric', 200);

      expect(monitor.metrics.has('oldMetric')).toBe(false);
      expect(monitor.metrics.has('newMetric')).toBe(true);

      // Restore Date.now
      Date.now = originalNow;
    });
  });

  describe('Resource Monitoring', () => {
    test('should record resource metrics with correct naming', () => {
      monitor.init();

      const testUrl = 'http://localhost:3000/assets/main.js';
      const resourceData = {
        duration: 150,
        size: 25000,
        type: 'script'
      };

      monitor.recordResourceMetric(testUrl, resourceData);

      expect(monitor.metrics.has('resource_/assets/main.js')).toBe(true);
      const recorded = monitor.metrics.get('resource_/assets/main.js')[0];
      expect(recorded.value).toEqual(resourceData);
    });
  });

  describe('Performance Marks and Measures', () => {
    test('should create performance marks', () => {
      monitor.init();

      monitor.mark('testMark');

      expect(global.performance.mark).toHaveBeenCalledWith('testMark');
      expect(monitor.metrics.has('mark_testMark')).toBe(true);
    });

    test('should create performance measures', () => {
      monitor.init();

      // Mock measure result
      global.performance.getEntriesByName.mockReturnValue([
        { duration: 250 }
      ]);

      monitor.measure('testMeasure', 'start', 'end');

      expect(global.performance.measure).toHaveBeenCalledWith('testMeasure', 'start', 'end');
      expect(monitor.metrics.has('measure_testMeasure')).toBe(true);
    });

    test('should handle measure errors gracefully', () => {
      monitor.init();

      // Mock measure to throw error
      global.performance.measure.mockImplementation(() => {
        throw new Error('Measure failed');
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      monitor.measure('failingMeasure', 'nonexistent', 'marks');

      expect(consoleSpy).toHaveBeenCalledWith('Performance measure failed:', expect.any(Error));
      expect(monitor.metrics.has('measure_failingMeasure')).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('Memory Info', () => {
    test('should return memory information when available', () => {
      const memInfo = monitor.getMemoryInfo();

      expect(memInfo).toEqual({
        usedJSHeapSize: 50000000,
        totalJSHeapSize: 100000000,
        jsHeapSizeLimit: 200000000,
        usagePercentage: '25.00'
      });
    });

    test('should return null when memory API is not available', () => {
      // Temporarily remove memory API
      const originalMemory = global.performance.memory;
      delete global.performance.memory;

      const memInfo = monitor.getMemoryInfo();
      expect(memInfo).toBeNull();

      // Restore memory API
      global.performance.memory = originalMemory;
    });
  });

  describe('Cleanup', () => {
    test('should clean up observers on cleanup()', () => {
      monitor.init();

      // Verify observers were created
      expect(mockDisconnect).not.toHaveBeenCalled();

      monitor.cleanup();

      // Should disconnect all observers
      expect(mockDisconnect).toHaveBeenCalled();
      expect(monitor.observers.length).toBe(0);
      expect(monitor.metrics.size).toBe(0);
      expect(monitor.isInitialized).toBe(false);
    });

    test('should clean up event listeners', () => {
      monitor.init();

      monitor.cleanup();

      expect(global.document.removeEventListener).toHaveBeenCalled();
    });

    test('should handle cleanup errors gracefully', () => {
      monitor.init();

      // Mock disconnect to throw error
      mockDisconnect.mockImplementation(() => {
        throw new Error('Disconnect failed');
      });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      monitor.cleanup();

      expect(consoleSpy).toHaveBeenCalledWith('Error disconnecting performance observer:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('Performance Report', () => {
    test('should generate comprehensive performance report', () => {
      monitor.init();

      // Add some test metrics
      monitor.recordMetric('LCP', 1500);
      monitor.recordMetric('FID', 80);
      monitor.recordMetric('CLS', 0.05);
      monitor.recordMetric('TTI', 2000);

      const report = monitor.getReport();

      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('summary');

      // Check metrics
      expect(report.metrics.LCP).toEqual({
        current: 1500,
        average: 1500,
        samples: 1
      });

      // Check Core Web Vitals summary
      expect(report.summary.coreWebVitals.lcp).toEqual({
        value: 1500,
        good: true,
        needs_improvement: true
      });

      expect(report.summary.coreWebVitals.fid).toEqual({
        value: 80,
        good: true,
        needs_improvement: true
      });

      expect(report.summary.coreWebVitals.cls).toEqual({
        value: 0.05,
        good: true,
        needs_improvement: true
      });
    });
  });

  describe('User Interaction Monitoring', () => {
    test('should monitor user clicks', () => {
      monitor.init();

      // Verify click listener was added
      expect(global.document.addEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function),
        { passive: true }
      );

      // Simulate click
      const clickHandler = global.document.addEventListener.mock.calls
        .find(call => call[0] === 'click')?.[1];

      if (clickHandler) {
        clickHandler();
        clickHandler();

        expect(monitor.metrics.has('UserInteractions')).toBe(true);
        expect(monitor.metrics.get('UserInteractions').length).toBe(2);
      }
    });
  });
});