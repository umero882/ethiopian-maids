/**
 * 📊 Production Monitoring & Analytics
 * Real-time performance tracking, error monitoring, and user analytics
 */

// =============================================
// PERFORMANCE MONITORING
// =============================================

class ProductionMonitor {
  constructor() {
    this.metrics = {
      pageLoads: 0,
      errors: 0,
      apiCalls: 0,
      userSessions: 0,
      conversionEvents: 0,
    };

    this.startTime = Date.now();
    this.isProduction = import.meta.env.NODE_ENV === 'production';

    if (this.isProduction) {
      this.initializeMonitoring();
    }
  }

  initializeMonitoring() {
    // Core Web Vitals monitoring
    this.trackCoreWebVitals();

    // Error boundary monitoring
    this.setupErrorTracking();

    // User interaction tracking
    this.trackUserInteractions();

    // API performance monitoring
    this.monitorAPIPerformance();

    // Business metrics tracking
    this.trackBusinessMetrics();
  }

  // =============================================
  // CORE WEB VITALS TRACKING
  // =============================================

  trackCoreWebVitals() {
    // Largest Contentful Paint (LCP)
    this.observeMetric('largest-contentful-paint', (entry) => {
      const lcp = entry.startTime;
      this.reportMetric('LCP', lcp, { target: 2500, good: lcp < 2500 });
    });

    // First Input Delay (FID)
    this.observeMetric('first-input', (entry) => {
      const fid = entry.processingStart - entry.startTime;
      this.reportMetric('FID', fid, { target: 100, good: fid < 100 });
    });

    // Cumulative Layout Shift (CLS)
    this.observeMetric('layout-shift', (entry) => {
      if (!entry.hadRecentInput) {
        const cls = entry.value;
        this.reportMetric('CLS', cls, { target: 0.1, good: cls < 0.1 });
      }
    });
  }

  observeMetric(type, callback) {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(callback);
      });
      observer.observe({ type, buffered: true });
    } catch (error) {
      console.warn(`Performance observer not supported for ${type}:`, error);
    }
  }

  // =============================================
  // ERROR TRACKING
  // =============================================

  setupErrorTracking() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.reportError('JavaScript Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.reportError('Unhandled Promise Rejection', {
        reason: event.reason,
        promise: event.promise,
      });
    });

    // React error boundary integration
    this.setupReactErrorBoundary();
  }

  setupReactErrorBoundary() {
    // This will be used by React Error Boundaries
    window.reportReactError = (error, errorInfo) => {
      this.reportError('React Error', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    };
  }

  // =============================================
  // USER INTERACTION TRACKING
  // =============================================

  trackUserInteractions() {
    // Page navigation tracking
    this.trackPageViews();

    // User engagement tracking
    this.trackEngagement();

    // Feature usage tracking
    this.trackFeatureUsage();
  }

  trackPageViews() {
    // Track initial page load
    this.reportEvent('page_view', {
      page: window.location.pathname,
      referrer: document.referrer,
      timestamp: Date.now(),
    });

    // Track SPA navigation
    const originalPushState = history.pushState;
    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      productionMonitor.reportEvent('page_view', {
        page: window.location.pathname,
        type: 'spa_navigation',
        timestamp: Date.now(),
      });
    };
  }

  trackEngagement() {
    let sessionStart = Date.now();
    let isActive = true;

    // Track session duration
    window.addEventListener('beforeunload', () => {
      const sessionDuration = Date.now() - sessionStart;
      this.reportEvent('session_end', {
        duration: sessionDuration,
        pages_viewed: this.metrics.pageLoads,
      });
    });

    // Track user activity
    ['click', 'scroll', 'keypress'].forEach((event) => {
      document.addEventListener(event, () => {
        if (!isActive) {
          isActive = true;
          sessionStart = Date.now();
        }
      });
    });
  }

  trackFeatureUsage() {
    // Track critical user actions
    this.trackConversionEvents();
    this.trackSearchUsage();
    this.trackProfileInteractions();
  }

  // =============================================
  // API PERFORMANCE MONITORING
  // =============================================

  monitorAPIPerformance() {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      const url = args[0];

      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;

        this.reportAPICall(url, {
          status: response.status,
          duration,
          success: response.ok,
        });

        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.reportAPICall(url, {
          status: 0,
          duration,
          success: false,
          error: error.message,
        });
        throw error;
      }
    };
  }

  // =============================================
  // BUSINESS METRICS TRACKING
  // =============================================

  trackBusinessMetrics() {
    // User registration funnel
    this.trackRegistrationFunnel();

    // Profile completion rates
    this.trackProfileCompletion();

    // Matching success rates
    this.trackMatchingMetrics();

    // Subscription conversions
    this.trackSubscriptionMetrics();
  }

  trackConversionEvents() {
    // Track key conversion points
    const conversionEvents = [
      'user_registered',
      'profile_completed',
      'first_search',
      'contact_initiated',
      'subscription_started',
      'payment_completed',
    ];

    conversionEvents.forEach((event) => {
      document.addEventListener(`custom:${event}`, (e) => {
        this.reportConversion(event, e.detail);
      });
    });
  }

  // =============================================
  // REPORTING METHODS
  // =============================================

  reportMetric(name, value, metadata = {}) {
    const metric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.pathname,
      userAgent: navigator.userAgent,
      ...metadata,
    };

    // Send to analytics service
    this.sendToAnalytics('performance_metric', metric);

    // Log in development
    if (!this.isProduction) {
    }
  }

  reportError(type, details) {
    this.metrics.errors++;

    const error = {
      type,
      details,
      timestamp: Date.now(),
      url: window.location.pathname,
      userAgent: navigator.userAgent,
      userId: this.getCurrentUserId(),
    };

    // Send to error tracking service
    this.sendToAnalytics('error', error);

    // Log in development
    if (!this.isProduction) {
      console.error(`🚨 Error Tracked: ${type}`, error);
    }
  }

  reportEvent(eventName, data = {}) {
    const event = {
      event: eventName,
      timestamp: Date.now(),
      url: window.location.pathname,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      ...data,
    };

    // Send to analytics service
    this.sendToAnalytics('user_event', event);

    // Log in development
    if (!this.isProduction) {
    }
  }

  reportAPICall(url, metrics) {
    this.metrics.apiCalls++;

    const apiCall = {
      url,
      timestamp: Date.now(),
      userId: this.getCurrentUserId(),
      ...metrics,
    };

    // Send to analytics service
    this.sendToAnalytics('api_call', apiCall);

    // Alert on slow API calls
    if (metrics.duration > 5000) {
      this.reportError('Slow API Call', { url, duration: metrics.duration });
    }
  }

  reportConversion(event, data = {}) {
    this.metrics.conversionEvents++;

    const conversion = {
      event,
      timestamp: Date.now(),
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      ...data,
    };

    // Send to analytics service
    this.sendToAnalytics('conversion', conversion);

    // Log in development
    if (!this.isProduction) {
    }
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  sendToAnalytics(type, data) {
    // In production, send to your analytics service
    if (this.isProduction) {
      // Example: Send to Google Analytics, Mixpanel, or custom analytics
      // gtag('event', type, data);
      // mixpanel.track(type, data);
      // fetch('/api/analytics', { method: 'POST', body: JSON.stringify({ type, data }) });
    }

    // Store locally for development/testing
    const analytics = JSON.parse(localStorage.getItem('analytics') || '[]');
    analytics.push({ type, data, timestamp: Date.now() });
    localStorage.setItem('analytics', JSON.stringify(analytics.slice(-1000))); // Keep last 1000 events
  }

  getCurrentUserId() {
    // Get current user ID from your auth system
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id || 'anonymous';
    } catch {
      return 'anonymous';
    }
  }

  getSessionId() {
    // Generate or retrieve session ID
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  // =============================================
  // PUBLIC API
  // =============================================

  // Method to manually track custom events
  track(eventName, properties = {}) {
    this.reportEvent(eventName, properties);
  }

  // Method to track user properties
  identify(userId, properties = {}) {
    this.reportEvent('user_identified', { userId, properties });
  }

  // Method to get current metrics
  getMetrics() {
    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime,
      timestamp: Date.now(),
    };
  }
}

// =============================================
// INITIALIZE MONITORING
// =============================================

const productionMonitor = new ProductionMonitor();

// Export for use in components
export default productionMonitor;

// Global access for debugging
if (typeof window !== 'undefined') {
  window.productionMonitor = productionMonitor;
}
