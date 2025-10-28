import { createLogger } from '@/utils/logger';
const log = createLogger('ErrorHandler');
/**
 * 🔧 Centralized Error Handler
 * Unified error handling across the application
 */

import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/databaseClient';

class CentralizedErrorHandler {
  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.errorQueue = [];
    this.maxQueueSize = 100;
  }

  /**
   * Handle different types of errors with consistent approach
   */
  async handleError(error, context = {}) {
    const errorInfo = this.categorizeError(error, context);

    // Log appropriately based on environment
    this.logError(errorInfo);

    // Show user-friendly message
    this.showUserMessage(errorInfo);

    // Report to monitoring service if critical
    if (errorInfo.severity === 'critical') {
      await this.reportError(errorInfo);
    }

    return errorInfo;
  }

  categorizeError(error, context) {
    const errorInfo = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      message: error?.message || String(error),
      stack: error?.stack,
      context,
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.getCurrentUserId(),
      severity: 'medium',
      category: 'unknown',
      userMessage: 'An unexpected error occurred',
    };

    // Categorize based on error type
    if (error?.code?.startsWith('PGRST')) {
      errorInfo.category = 'database';
      errorInfo.severity = 'high';
      errorInfo.userMessage = 'Database connection issue. Please try again.';
    } else if (error?.name === 'NetworkError') {
      errorInfo.category = 'network';
      errorInfo.severity = 'medium';
      errorInfo.userMessage =
        'Network connection issue. Please check your internet.';
    } else if (error?.name === 'ValidationError') {
      errorInfo.category = 'validation';
      errorInfo.severity = 'low';
      errorInfo.userMessage = error.message; // Show validation errors directly
    } else if (context.component === 'auth') {
      errorInfo.category = 'authentication';
      errorInfo.severity = 'high';
      errorInfo.userMessage =
        'Authentication failed. Please try logging in again.';
    }

    return errorInfo;
  }

  logError(errorInfo) {
    if (this.isProduction) {
      // Production: Only log critical errors to console
      if (errorInfo.severity === 'critical') {
        console.error(
          `[${errorInfo.category.toUpperCase()}]`,
          errorInfo.message
        );
      }
    } else {
      // Development: Log all errors with full details
      console.group(`${errorInfo.category.toUpperCase()} ERROR`);
      log.error('Message:', errorInfo.message);
      log.error('Context:', errorInfo.context);
      log.error('Stack:', errorInfo.stack);
      console.groupEnd();
    }

    // Add to queue for batch reporting
    this.addToQueue(errorInfo);
  }

  showUserMessage(errorInfo) {
    const toastConfig = {
      title: this.getErrorTitle(errorInfo.category),
      description: errorInfo.userMessage,
      variant: errorInfo.severity === 'low' ? 'default' : 'destructive',
    };

    toast(toastConfig);
  }

  getErrorTitle(category) {
    const titles = {
      database: 'Database Error',
      network: 'Connection Error',
      validation: 'Validation Error',
      authentication: 'Authentication Error',
      authorization: 'Access Denied',
      unknown: 'Error',
    };
    return titles[category] || 'Error';
  }

  addToQueue(errorInfo) {
    this.errorQueue.push(errorInfo);

    // Prevent memory leaks
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift();
    }
  }

  async reportError(errorInfo) {
    try {
      await supabase.from('error_logs').insert([
        {
          error_id: errorInfo.id,
          message: errorInfo.message,
          category: errorInfo.category,
          severity: errorInfo.severity,
          context: errorInfo.context,
          stack: errorInfo.stack,
          url: errorInfo.url,
          user_id: errorInfo.userId,
          created_at: errorInfo.timestamp,
        },
      ]);
    } catch (reportError) {
      log.error('Failed to report error:', reportError);
    }
  }

  getCurrentUserId() {
    try {
      const user = JSON.parse(
        localStorage.getItem('supabase.auth.token')
      )?.user;
      return user?.id || null;
    } catch {
      return null;
    }
  }

  // Batch error reporting for performance
  async flushErrorQueue() {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      await supabase.from('error_logs').insert(
        errors.map((error) => ({
          error_id: error.id,
          message: error.message,
          category: error.category,
          severity: error.severity,
          context: error.context,
          url: error.url,
          user_id: error.userId,
          created_at: error.timestamp,
        }))
      );
    } catch (error) {
      log.error('Failed to flush error queue:', error);
      // Re-add errors to queue for retry
      this.errorQueue.unshift(...errors);
    }
  }
}

// Export singleton instance
export const errorHandler = new CentralizedErrorHandler();

// Convenience functions
export const handleError = (error, context) =>
  errorHandler.handleError(error, context);
export const logError = (message, error, context) =>
  errorHandler.handleError(error, { ...context, message });
export const handleAuthError = (error) =>
  errorHandler.handleError(error, { component: 'auth' });
export const handleDatabaseError = (error) =>
  errorHandler.handleError(error, { component: 'database' });
export const handleValidationError = (error) =>
  errorHandler.handleError(error, { component: 'validation' });

// Auto-flush errors every 30 seconds (guarded for HMR)
if (typeof window !== 'undefined') {
  if (window.__errorHandlerIntervalId) {
    clearInterval(window.__errorHandlerIntervalId);
  }
  window.__errorHandlerIntervalId = setInterval(() => {
    errorHandler.flushErrorQueue();
  }, 30000);
}
