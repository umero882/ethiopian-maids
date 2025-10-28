/**
 * 📈 User Analytics & Conversion Tracking
 * Track user behavior, conversion funnels, and business metrics
 */

import productionMonitor from './productionMonitoring';

class UserAnalytics {
  constructor() {
    this.isProduction = import.meta.env.NODE_ENV === 'production';
    this.sessionData = this.initializeSession();
    this.conversionFunnel = this.initializeConversionFunnel();

    if (this.isProduction) {
      this.setupAnalytics();
    }
  }

  // =============================================
  // SESSION MANAGEMENT
  // =============================================

  initializeSession() {
    const sessionId = this.getSessionId();
    const sessionData = {
      sessionId,
      startTime: Date.now(),
      pageViews: 0,
      interactions: 0,
      timeSpent: 0,
      referrer: document.referrer,
      utmParams: this.getUTMParams(),
      deviceInfo: this.getDeviceInfo(),
    };

    // Store session data
    sessionStorage.setItem('analyticsSession', JSON.stringify(sessionData));
    return sessionData;
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  getUTMParams() {
    const urlParams = new URLSearchParams(window.location.search);
    return {
      source: urlParams.get('utm_source'),
      medium: urlParams.get('utm_medium'),
      campaign: urlParams.get('utm_campaign'),
      term: urlParams.get('utm_term'),
      content: urlParams.get('utm_content'),
    };
  }

  getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      isMobile:
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ),
    };
  }

  // =============================================
  // CONVERSION FUNNEL TRACKING
  // =============================================

  initializeConversionFunnel() {
    return {
      // Registration funnel
      registration: {
        started: false,
        emailEntered: false,
        passwordCreated: false,
        roleSelected: false,
        completed: false,
      },

      // Profile completion funnel
      profileCompletion: {
        started: false,
        basicInfoCompleted: false,
        documentsUploaded: false,
        skillsAdded: false,
        completed: false,
      },

      // Search and discovery funnel
      searchFunnel: {
        firstSearch: false,
        filtersUsed: false,
        profileViewed: false,
        contactInitiated: false,
      },

      // Subscription funnel
      subscriptionFunnel: {
        pricingViewed: false,
        planSelected: false,
        paymentStarted: false,
        paymentCompleted: false,
      },
    };
  }

  // =============================================
  // EVENT TRACKING METHODS
  // =============================================

  // Track page views
  trackPageView(page, additionalData = {}) {
    this.sessionData.pageViews++;

    const pageViewData = {
      page,
      timestamp: Date.now(),
      sessionId: this.sessionData.sessionId,
      referrer: document.referrer,
      ...additionalData,
    };

    this.sendEvent('page_view', pageViewData);
    this.updateSession();
  }

  // Track user interactions
  trackInteraction(action, element, additionalData = {}) {
    this.sessionData.interactions++;

    const interactionData = {
      action,
      element,
      timestamp: Date.now(),
      sessionId: this.sessionData.sessionId,
      page: window.location.pathname,
      ...additionalData,
    };

    this.sendEvent('user_interaction', interactionData);
    this.updateSession();
  }

  // Track conversion events
  trackConversion(event, data = {}) {
    const conversionData = {
      event,
      timestamp: Date.now(),
      sessionId: this.sessionData.sessionId,
      userId: this.getCurrentUserId(),
      ...data,
    };

    this.sendEvent('conversion', conversionData);
    this.updateConversionFunnel(event, data);

    // Trigger custom event for other systems
    this.dispatchCustomEvent(`custom:${event}`, conversionData);
  }

  // Track business metrics
  trackBusinessMetric(metric, value, metadata = {}) {
    const businessData = {
      metric,
      value,
      timestamp: Date.now(),
      sessionId: this.sessionData.sessionId,
      userId: this.getCurrentUserId(),
      ...metadata,
    };

    this.sendEvent('business_metric', businessData);
  }

  // =============================================
  // SPECIFIC TRACKING METHODS
  // =============================================

  // Registration funnel tracking
  trackRegistrationStart(userType) {
    this.conversionFunnel.registration.started = true;
    this.trackConversion('registration_started', { userType });
  }

  trackRegistrationStep(step, data = {}) {
    const steps = ['emailEntered', 'passwordCreated', 'roleSelected'];
    if (steps.includes(step)) {
      this.conversionFunnel.registration[step] = true;
    }
    this.trackConversion(`registration_${step}`, data);
  }

  trackRegistrationComplete(userId, userType) {
    this.conversionFunnel.registration.completed = true;
    this.trackConversion('registration_completed', { userId, userType });
    this.identifyUser(userId, {
      userType,
      registrationDate: new Date().toISOString(),
    });
  }

  // Profile completion tracking
  trackProfileCompletionStart() {
    this.conversionFunnel.profileCompletion.started = true;
    this.trackConversion('profile_completion_started');
  }

  trackProfileCompletionStep(step, completionPercentage = 0) {
    const steps = ['basicInfoCompleted', 'documentsUploaded', 'skillsAdded'];
    if (steps.includes(step)) {
      this.conversionFunnel.profileCompletion[step] = true;
    }
    this.trackConversion(`profile_${step}`, { completionPercentage });
  }

  trackProfileCompletionComplete() {
    this.conversionFunnel.profileCompletion.completed = true;
    this.trackConversion('profile_completion_completed');
  }

  // Search and discovery tracking
  trackFirstSearch(searchParams) {
    this.conversionFunnel.searchFunnel.firstSearch = true;
    this.trackConversion('first_search', { searchParams });
  }

  trackSearchFiltersUsed(filters) {
    this.conversionFunnel.searchFunnel.filtersUsed = true;
    this.trackConversion('search_filters_used', { filters });
  }

  trackProfileView(profileId, profileType) {
    this.conversionFunnel.searchFunnel.profileViewed = true;
    this.trackConversion('profile_viewed', { profileId, profileType });
  }

  trackContactInitiated(contactType, targetUserId) {
    this.conversionFunnel.searchFunnel.contactInitiated = true;
    this.trackConversion('contact_initiated', { contactType, targetUserId });
  }

  // Subscription tracking
  trackPricingPageView() {
    this.conversionFunnel.subscriptionFunnel.pricingViewed = true;
    this.trackConversion('pricing_viewed');
  }

  trackPlanSelection(planType, planPrice) {
    this.conversionFunnel.subscriptionFunnel.planSelected = true;
    this.trackConversion('plan_selected', { planType, planPrice });
  }

  trackPaymentStarted(planType, amount) {
    this.conversionFunnel.subscriptionFunnel.paymentStarted = true;
    this.trackConversion('payment_started', { planType, amount });
  }

  trackPaymentCompleted(planType, amount, transactionId) {
    this.conversionFunnel.subscriptionFunnel.paymentCompleted = true;
    this.trackConversion('payment_completed', {
      planType,
      amount,
      transactionId,
    });
  }

  // Feature usage tracking
  trackFeatureUsage(feature, action, metadata = {}) {
    this.trackConversion('feature_used', { feature, action, ...metadata });
  }

  // Error tracking
  trackUserError(errorType, errorMessage, context = {}) {
    this.sendEvent('user_error', {
      errorType,
      errorMessage,
      context,
      timestamp: Date.now(),
      sessionId: this.sessionData.sessionId,
      userId: this.getCurrentUserId(),
    });
  }

  // =============================================
  // USER IDENTIFICATION
  // =============================================

  identifyUser(userId, properties = {}) {
    const userProperties = {
      userId,
      identifiedAt: new Date().toISOString(),
      sessionId: this.sessionData.sessionId,
      ...properties,
    };

    this.sendEvent('user_identified', userProperties);

    // Store user ID for future events
    localStorage.setItem('analyticsUserId', userId);
  }

  getCurrentUserId() {
    return localStorage.getItem('analyticsUserId') || 'anonymous';
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  updateSession() {
    this.sessionData.timeSpent = Date.now() - this.sessionData.startTime;
    sessionStorage.setItem(
      'analyticsSession',
      JSON.stringify(this.sessionData)
    );
  }

  updateConversionFunnel(event, data) {
    // Update funnel state based on event
    localStorage.setItem(
      'conversionFunnel',
      JSON.stringify(this.conversionFunnel)
    );
  }

  dispatchCustomEvent(eventName, data) {
    const customEvent = new CustomEvent(eventName, { detail: data });
    document.dispatchEvent(customEvent);
  }

  sendEvent(eventType, data) {
    // Send to production monitoring
    if (typeof productionMonitor !== 'undefined') {
      productionMonitor.reportEvent(eventType, data);
    }

    // Send to external analytics services in production
    if (this.isProduction) {
      this.sendToExternalAnalytics(eventType, data);
    }

    // Log in development
    if (!this.isProduction) {
    }
  }

  sendToExternalAnalytics(eventType, data) {
    // Google Analytics 4
    if (typeof gtag !== 'undefined') {
      gtag('event', eventType, data);
    }

    // Facebook Pixel
    if (typeof fbq !== 'undefined') {
      fbq('track', eventType, data);
    }

    // Custom analytics endpoint
    if (this.isProduction) {
      fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType, data }),
      }).catch((error) => {
        console.warn('Failed to send analytics:', error);
      });
    }
  }

  setupAnalytics() {
    // Setup automatic session tracking
    this.setupSessionTracking();

    // Setup scroll tracking
    this.setupScrollTracking();

    // Setup click tracking
    this.setupClickTracking();

    // Setup form tracking
    this.setupFormTracking();
  }

  setupSessionTracking() {
    // Track session end
    window.addEventListener('beforeunload', () => {
      this.updateSession();
      this.sendEvent('session_end', {
        sessionId: this.sessionData.sessionId,
        duration: this.sessionData.timeSpent,
        pageViews: this.sessionData.pageViews,
        interactions: this.sessionData.interactions,
      });
    });

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.sendEvent('page_hidden', { timestamp: Date.now() });
      } else {
        this.sendEvent('page_visible', { timestamp: Date.now() });
      }
    });
  }

  setupScrollTracking() {
    let maxScroll = 0;
    let scrollMilestones = [25, 50, 75, 90, 100];
    let trackedMilestones = new Set();

    window.addEventListener('scroll', () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) *
          100
      );

      maxScroll = Math.max(maxScroll, scrollPercent);

      scrollMilestones.forEach((milestone) => {
        if (scrollPercent >= milestone && !trackedMilestones.has(milestone)) {
          trackedMilestones.add(milestone);
          this.trackInteraction('scroll', `${milestone}%`, { scrollPercent });
        }
      });
    });
  }

  setupClickTracking() {
    document.addEventListener('click', (event) => {
      const element = event.target;
      const elementInfo = {
        tagName: element.tagName,
        className: element.className,
        id: element.id,
        text: element.textContent?.substring(0, 100) || '',
        href: element.href || null,
      };

      this.trackInteraction('click', elementInfo);
    });
  }

  setupFormTracking() {
    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target;
      const formInfo = {
        formId: form.id,
        formClass: form.className,
        action: form.action,
        method: form.method,
      };

      this.trackInteraction('form_submit', formInfo);
    });

    // Track form field interactions
    document.addEventListener('focus', (event) => {
      if (
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA'
      ) {
        const fieldInfo = {
          fieldName: event.target.name,
          fieldType: event.target.type,
          fieldId: event.target.id,
        };

        this.trackInteraction('form_field_focus', fieldInfo);
      }
    });
  }

  // =============================================
  // PUBLIC API
  // =============================================

  // Get analytics data for debugging
  getAnalyticsData() {
    return {
      session: this.sessionData,
      conversionFunnel: this.conversionFunnel,
      userId: this.getCurrentUserId(),
    };
  }

  // Reset analytics data (for testing)
  resetAnalytics() {
    sessionStorage.removeItem('analyticsSession');
    sessionStorage.removeItem('sessionId');
    localStorage.removeItem('conversionFunnel');
    localStorage.removeItem('analyticsUserId');

    this.sessionData = this.initializeSession();
    this.conversionFunnel = this.initializeConversionFunnel();
  }
}

// =============================================
// INITIALIZE ANALYTICS
// =============================================

const userAnalytics = new UserAnalytics();

// Export for use in components
export default userAnalytics;

// Global access for debugging
if (typeof window !== 'undefined') {
  window.userAnalytics = userAnalytics;
}
