/**
 * Production Configuration Service
 * Manages environment-specific settings and validates production readiness
 */

import { createLogger } from '@/utils/logger';
const log = createLogger('ProdConfig');

class ProductionConfigService {
  constructor() {
    this.environment = import.meta.env.NODE_ENV || 'development';
    this.isProduction = this.environment === 'production';
    this.useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true';

    // Validate production configuration on initialization
    if (this.isProduction) {
      this.validateProductionConfig();
    }
  }

  /**
   * Validate that all required production configurations are set
   */
  validateProductionConfig() {
    const requiredEnvVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_PHONE_NUMBER',
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) =>
        !import.meta.env[varName] || import.meta.env[varName].includes('YOUR_')
    );

    if (missingVars.length > 0) {
      log.error(
        'Missing required environment variables for production:',
        missingVars
      );
      throw new Error(
        `Production configuration incomplete. Missing: ${missingVars.join(', ')}`
      );
    }

    if (this.useMockData) {
      log.error('Mock data is enabled in production environment');
      throw new Error('VITE_USE_MOCK_DATA must be false in production');
    }

    log.info('Production configuration validated successfully');
  }

  /**
   * Get database configuration
   */
  getDatabaseConfig() {
    return {
      url: import.meta.env.VITE_SUPABASE_URL,
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      serviceKey: import.meta.env.SUPABASE_SERVICE_KEY, // Server-side only
      useMockData: this.useMockData,
    };
  }

  /**
   * Get Twilio configuration
   */
  getTwilioConfig() {
    return {
      accountSid: import.meta.env.TWILIO_ACCOUNT_SID,
      authToken: import.meta.env.TWILIO_AUTH_TOKEN,
      phoneNumber: import.meta.env.TWILIO_PHONE_NUMBER,
      verifyServiceSid: import.meta.env.TWILIO_VERIFY_SERVICE_SID,
    };
  }

  /**
   * Get Stripe configuration
   */
  getStripeConfig() {
    return {
      publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
      secretKey: import.meta.env.STRIPE_SECRET_KEY, // Server-side only
      webhookSecret: import.meta.env.STRIPE_WEBHOOK_SECRET, // Server-side only
    };
  }

  /**
   * Get news API configuration
   */
  getNewsConfig() {
    return {
      newsApiKey: import.meta.env.REACT_APP_NEWS_API_KEY,
      currentsApiKey: import.meta.env.REACT_APP_CURRENTS_API_KEY,
      enableRealNews: import.meta.env.VITE_ENABLE_REAL_NEWS === 'true',
      updateInterval: parseInt(import.meta.env.VITE_NEWS_UPDATE_INTERVAL) || 60,
      maxItems: parseInt(import.meta.env.VITE_MAX_NEWS_ITEMS) || 20,
    };
  }

  /**
   * Get CORS configuration
   */
  getCorsConfig() {
    const corsOrigin = import.meta.env.CORS_ORIGIN || '';
    return {
      allowedOrigins: corsOrigin
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'apikey',
        'X-Client-Info',
      ],
    };
  }

  /**
   * Get application URLs
   */
  getAppConfig() {
    return {
      appUrl: import.meta.env.VITE_APP_URL || 'http://localhost:5174',
      apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
      environment: this.environment,
      isProduction: this.isProduction,
      enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
      enableErrorReporting:
        import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
    };
  }

  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(featureName) {
    const featureFlags = {
      realTimeChat: !this.useMockData,
      paymentProcessing:
        !this.useMockData && this.getStripeConfig().publishableKey,
      smsVerification: !this.useMockData && this.getTwilioConfig().accountSid,
      newsIntegration: this.getNewsConfig().enableRealNews,
      analytics: this.getAppConfig().enableAnalytics,
      errorReporting: this.getAppConfig().enableErrorReporting,
    };

    return featureFlags[featureName] || false;
  }

  /**
   * Get production readiness status
   */
  getProductionReadiness() {
    const checks = {
      database: {
        name: 'Database Connection',
        status:
          this.getDatabaseConfig().url && this.getDatabaseConfig().anonKey
            ? 'ready'
            : 'missing',
        required: true,
      },
      authentication: {
        name: 'Authentication System',
        status: !this.useMockData ? 'ready' : 'mock_mode',
        required: true,
      },
      payments: {
        name: 'Payment Processing',
        status:
          this.getStripeConfig().publishableKey &&
          !this.getStripeConfig().publishableKey.includes('YOUR_')
            ? 'ready'
            : 'missing',
        required: true,
      },
      communications: {
        name: 'SMS/Phone Support',
        status:
          this.getTwilioConfig().accountSid &&
          !this.getTwilioConfig().accountSid.includes('YOUR_')
            ? 'ready'
            : 'missing',
        required: true,
      },
      fileStorage: {
        name: 'File Storage',
        status: this.getDatabaseConfig().url ? 'ready' : 'missing',
        required: true,
      },
      newsIntegration: {
        name: 'News Integration',
        status: this.getNewsConfig().newsApiKey ? 'ready' : 'missing',
        required: false,
      },
    };

    const readyCount = Object.values(checks).filter(
      (check) => check.status === 'ready'
    ).length;
    const requiredCount = Object.values(checks).filter(
      (check) => check.required
    ).length;
    const requiredReadyCount = Object.values(checks).filter(
      (check) => check.required && check.status === 'ready'
    ).length;

    return {
      checks,
      overall: requiredReadyCount === requiredCount ? 'ready' : 'incomplete',
      readyCount,
      totalCount: Object.keys(checks).length,
      requiredReadyCount,
      requiredCount,
      percentage: Math.round((readyCount / Object.keys(checks).length) * 100),
    };
  }

  /**
   * Log production readiness report
   */
  logProductionReadiness() {
    const readiness = this.getProductionReadiness();

    /* console.log(
      `Mock Data: ${this.useMockData ? '❌ ENABLED' : '✅ DISABLED'}`
    ); */
    /* console.log(
      `Overall Status: ${readiness.overall === 'ready' ? '✅ READY' : '⚠️ INCOMPLETE'}`
    ); */
    /* console.log(
      `Progress: ${readiness.readyCount}/${readiness.totalCount} (${readiness.percentage}%)`
    ); */
    /* console.log(
      `Required: ${readiness.requiredReadyCount}/${readiness.requiredCount}`
    ); */

    Object.entries(readiness.checks).forEach(([key, check]) => {
      const icon =
        check.status === 'ready'
          ? '✅'
          : check.status === 'mock_mode'
            ? '⚠️'
            : '❌';
      const required = check.required ? ' (Required)' : ' (Optional)';
      /* console.log(
        `  ${icon} ${check.name}: ${check.status.toUpperCase()}${required}`
      ); */
    });


    return readiness;
  }

  /**
   * Throw error if not production ready
   */
  ensureProductionReady() {
    const readiness = this.getProductionReadiness();

    if (readiness.overall !== 'ready') {
      const missingRequired = Object.entries(readiness.checks)
        .filter(([key, check]) => check.required && check.status !== 'ready')
        .map(([key, check]) => check.name);

      throw new Error(
        `Production deployment blocked. Missing required components: ${missingRequired.join(', ')}`
      );
    }

    return true;
  }
}

// Create singleton instance
export const productionConfig = new ProductionConfigService();
export default productionConfig;
