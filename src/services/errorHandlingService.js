import { supabase } from '@/lib/databaseClient';
import { toast } from '@/components/ui/use-toast';

/**
 * Production Error Handling and Monitoring Service
 * Replaces console.log with proper error logging and user feedback
 */
class ErrorHandlingService {
  constructor() {
    this.isProduction = import.meta.env.NODE_ENV === 'production';
    this.enableErrorReporting =
      import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true';
    this.errorQueue = [];
    this.setupGlobalErrorHandlers();
  }

  /**
   * Setup global error handlers
   */
  setupGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled Promise Rejection', event.reason, {
        type: 'unhandled_promise',
        promise: event.promise,
      });
    });

    // Handle JavaScript errors
    window.addEventListener('error', (event) => {
      this.logError('JavaScript Error', event.error, {
        type: 'javascript_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Handle React error boundaries (if needed)
    if (typeof window !== 'undefined') {
      window.addEventListener('react-error', (event) => {
        this.logError('React Error', event.detail.error, {
          type: 'react_error',
          componentStack: event.detail.componentStack,
        });
      });
    }
  }

  /**
   * Log error with context and user feedback
   */
  async logError(title, error, context = {}) {
    const errorData = {
      title,
      message: error?.message || String(error),
      stack: error?.stack,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.getCurrentUserId(),
    };

    // Log to console in development
    if (!this.isProduction) {
      console.error(`❌ ${title}:`, error, context);
    }

    // Store error for reporting
    this.errorQueue.push(errorData);

    // Send to error reporting service if enabled
    if (this.enableErrorReporting) {
      await this.reportError(errorData);
    }

    // Show user-friendly message for critical errors
    if (this.isCriticalError(error)) {
      this.showUserErrorMessage(title, error);
    }

    return errorData;
  }

  /**
   * Log warning (non-critical issues)
   */
  logWarning(title, message, context = {}) {
    const warningData = {
      title,
      message,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userId: this.getCurrentUserId(),
    };

    if (!this.isProduction) {
      console.warn(`⚠️ ${title}:`, message, context);
    }

    // Store warning for analysis
    this.errorQueue.push({ ...warningData, level: 'warning' });
  }

  /**
   * Log info (general information)
   */
  logInfo(title, message, context = {}) {
    if (!this.isProduction) {
    }

    // In production, only log important info events
    if (this.isProduction && this.isImportantInfo(title)) {
      this.errorQueue.push({
        title,
        message,
        context,
        level: 'info',
        timestamp: new Date().toISOString(),
        userId: this.getCurrentUserId(),
      });
    }
  }

  /**
   * Report error to external service or database
   */
  async reportError(errorData) {
    try {
      // Store in Supabase for analysis
      const { error } = await supabase.from('error_logs').insert([
        {
          title: errorData.title,
          message: errorData.message,
          stack: errorData.stack,
          context: errorData.context,
          url: errorData.url,
          user_agent: errorData.userAgent,
          user_id: errorData.userId,
          created_at: errorData.timestamp,
        },
      ]);

      if (error) {
        console.error('Failed to store error log:', error);
      }

      // External error reporting can be added by setting REACT_APP_SENTRY_DSN env variable
      // await this.sendToExternalService(errorData);
    } catch (reportingError) {
      console.error('Error reporting failed:', reportingError);
    }
  }

  /**
   * Determine if error is critical and needs user notification
   */
  isCriticalError(error) {
    const criticalPatterns = [
      'network error',
      'authentication failed',
      'payment failed',
      'database error',
      'permission denied',
    ];

    const errorMessage = (error?.message || String(error)).toLowerCase();
    return criticalPatterns.some((pattern) => errorMessage.includes(pattern));
  }

  /**
   * Determine if info message is important enough to log in production
   */
  isImportantInfo(title) {
    const importantPatterns = [
      'user login',
      'user registration',
      'payment success',
      'subscription change',
      'profile completion',
    ];

    return importantPatterns.some((pattern) =>
      title.toLowerCase().includes(pattern)
    );
  }

  /**
   * Show user-friendly error message
   */
  showUserErrorMessage(title, error) {
    const userFriendlyMessages = {
      'network error':
        'Connection issue. Please check your internet and try again.',
      'authentication failed': 'Login session expired. Please log in again.',
      'payment failed':
        'Payment could not be processed. Please check your payment details.',
      'database error':
        'Service temporarily unavailable. Please try again in a moment.',
      'permission denied': "You don't have permission to perform this action.",
    };

    const errorMessage = (error?.message || String(error)).toLowerCase();
    let userMessage = 'An unexpected error occurred. Please try again.';

    // Find matching user-friendly message
    for (const [pattern, message] of Object.entries(userFriendlyMessages)) {
      if (errorMessage.includes(pattern)) {
        userMessage = message;
        break;
      }
    }

    toast({
      title: 'Error',
      description: userMessage,
      variant: 'destructive',
    });
  }

  /**
   * Get current user ID for error context
   */
  getCurrentUserId() {
    try {
      // Try to get user from auth context or session storage
      const authData = JSON.parse(
        sessionStorage.getItem('supabase.auth.token') || '{}'
      );
      return authData?.user?.id || null;
    } catch {
      return null;
    }
  }

  /**
   * Handle async operation with error handling
   */
  async handleAsync(operation, errorTitle = 'Operation Failed') {
    try {
      return await operation();
    } catch (error) {
      await this.logError(errorTitle, error);
      throw error;
    }
  }

  /**
   * Wrap component method with error boundary
   */
  withErrorBoundary(fn, errorTitle = 'Component Error') {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        await this.logError(errorTitle, error, { args });
        throw error;
      }
    };
  }

  /**
   * Get error statistics for monitoring
   */
  async getErrorStats(timeframe = '24h') {
    try {
      const timeframeSql =
        timeframe === '24h'
          ? "created_at > NOW() - INTERVAL '24 hours'"
          : timeframe === '7d'
            ? "created_at > NOW() - INTERVAL '7 days'"
            : "created_at > NOW() - INTERVAL '30 days'";

      const { data, error } = await supabase
        .from('error_logs')
        .select('title, message, created_at')
        .filter(
          'created_at',
          'gte',
          new Date(
            Date.now() -
              (timeframe === '24h'
                ? 24 * 60 * 60 * 1000
                : timeframe === '7d'
                  ? 7 * 24 * 60 * 60 * 1000
                  : 30 * 24 * 60 * 60 * 1000)
          ).toISOString()
        );

      if (error) throw error;

      // Group errors by type
      const errorCounts = {};
      data?.forEach((log) => {
        errorCounts[log.title] = (errorCounts[log.title] || 0) + 1;
      });

      return {
        totalErrors: data?.length || 0,
        errorTypes: errorCounts,
        timeframe,
      };
    } catch (error) {
      console.error('Failed to get error stats:', error);
      return {
        totalErrors: 0,
        errorTypes: {},
        timeframe,
        error: error.message,
      };
    }
  }

  /**
   * Clear old error logs (cleanup)
   */
  async cleanupOldLogs(daysToKeep = 30) {
    try {
      const cutoffDate = new Date(
        Date.now() - daysToKeep * 24 * 60 * 60 * 1000
      ).toISOString();

      const { error } = await supabase
        .from('error_logs')
        .delete()
        .lt('created_at', cutoffDate);

      if (error) throw error;

      this.logInfo(
        'Log Cleanup',
        `Cleaned up error logs older than ${daysToKeep} days`
      );
    } catch (error) {
      this.logError('Log Cleanup Failed', error);
    }
  }

  /**
   * Export error logs for analysis
   */
  async exportErrorLogs(startDate, endDate) {
    try {
      const { data, error } = await supabase
        .from('error_logs')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        logs: data || [],
        count: data?.length || 0,
      };
    } catch (error) {
      this.logError('Export Error Logs Failed', error);
      return {
        success: false,
        logs: [],
        count: 0,
        error: error.message,
      };
    }
  }
}

// Create singleton instance
export const errorHandler = new ErrorHandlingService();

// Export convenience methods
export const logError = (title, error, context) =>
  errorHandler.logError(title, error, context);
export const logWarning = (title, message, context) =>
  errorHandler.logWarning(title, message, context);
export const logInfo = (title, message, context) =>
  errorHandler.logInfo(title, message, context);
export const handleAsync = (operation, errorTitle) =>
  errorHandler.handleAsync(operation, errorTitle);
export const withErrorBoundary = (fn, errorTitle) =>
  errorHandler.withErrorBoundary(fn, errorTitle);

export default errorHandler;
