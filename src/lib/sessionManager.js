/**
 * Session Manager - Handles session persistence and automatic refresh
 * Prevents premature logouts and ensures continuous authentication
 */

import { supabase } from './databaseClient';
import { createLogger } from '@/utils/logger';

const log = createLogger('SessionManager');

class SessionManager {
  constructor() {
    this.refreshInterval = null;
    this.lastActivityTime = Date.now();
    this.isRefreshing = false;
    this.sessionCheckInterval = 10 * 60 * 1000; // Check every 10 minutes (less aggressive)
    this.inactivityTimeout = 24 * 60 * 60 * 1000; // 24 hours of inactivity
    this.lastVisibilityCheck = 0;
    this.visibilityCheckDebounce = 3000; // 3 seconds debounce for visibility changes
  }

  /**
   * Initialize session monitoring
   */
  initialize() {
    log.debug('📊 Initializing session manager...');

    // Track user activity
    this.trackActivity();

    // Start periodic session refresh
    this.startSessionRefresh();

    // Listen for visibility changes (tab becomes active) with debouncing
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Debounce visibility checks to prevent rapid-fire session checks
        const now = Date.now();
        if (now - this.lastVisibilityCheck > this.visibilityCheckDebounce) {
          this.lastVisibilityCheck = now;
          // Delay the check slightly to allow the page to stabilize
          setTimeout(() => this.checkAndRefreshSession(), 500);
        }
      }
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      log.debug('📶 Connection restored, checking session...');
      this.checkAndRefreshSession();
    });

    log.debug('✅ Session manager initialized');
  }

  /**
   * Track user activity to update last activity timestamp
   */
  trackActivity() {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

    const updateActivity = () => {
      this.lastActivityTime = Date.now();
    };

    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
  }

  /**
   * Start periodic session refresh
   */
  startSessionRefresh() {
    // Clear existing interval if any
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Check session every 5 minutes
    this.refreshInterval = setInterval(() => {
      this.checkAndRefreshSession();
    }, this.sessionCheckInterval);

    log.debug('⏰ Session refresh interval started');
  }

  /**
   * Check if session needs refresh and refresh if necessary
   */
  async checkAndRefreshSession() {
    // Prevent multiple simultaneous refreshes
    if (this.isRefreshing) {
      log.debug('🔄 Session refresh already in progress, skipping...');
      return;
    }

    try {
      this.isRefreshing = true;

      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        log.warn('⚠️ Error getting session:', error.message);
        return;
      }

      if (!session) {
        log.debug('❌ No active session found');
        return;
      }

      // Check if user has been inactive for too long
      const inactiveTime = Date.now() - this.lastActivityTime;
      if (inactiveTime > this.inactivityTimeout) {
        log.info('⏱️ User inactive for too long, session will expire naturally');
        return;
      }

      // Check if token is close to expiry (within 15 minutes - more lenient)
      const expiresAt = session.expires_at * 1000; // Convert to milliseconds
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;
      const fifteenMinutes = 15 * 60 * 1000;

      log.debug('📅 Session status:', {
        expiresAt: new Date(expiresAt).toISOString(),
        timeUntilExpiry: `${Math.floor(timeUntilExpiry / 1000 / 60)} minutes`,
        needsRefresh: timeUntilExpiry < fifteenMinutes
      });

      // Refresh if token expires in less than 15 minutes
      if (timeUntilExpiry < fifteenMinutes) {
        log.info('🔄 Session expiring soon, refreshing token...');
        await this.refreshSession();
      } else {
        log.debug('✅ Session is valid, no refresh needed');
      }

    } catch (error) {
      log.error('❌ Error checking session:', error);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Manually refresh the session
   */
  async refreshSession() {
    try {
      log.debug('🔄 Refreshing session...');

      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        log.error('❌ Session refresh failed:', error.message);
        return { success: false, error };
      }

      if (!data || !data.session) {
        log.warn('⚠️ No session data returned from refresh');
        return { success: false, error: new Error('No session data') };
      }

      log.info('✅ Session refreshed successfully');
      log.debug('🆕 New session expires at:', new Date(data.session.expires_at * 1000).toISOString());

      return { success: true, session: data.session };

    } catch (error) {
      log.error('❌ Exception during session refresh:', error);
      return { success: false, error };
    }
  }

  /**
   * Manually trigger session check (useful after navigation)
   */
  async ensureSession() {
    await this.checkAndRefreshSession();
  }

  /**
   * Get time until session expires
   */
  async getTimeUntilExpiry() {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        return null;
      }

      const expiresAt = session.expires_at * 1000;
      const now = Date.now();
      const timeUntilExpiry = expiresAt - now;

      return {
        milliseconds: timeUntilExpiry,
        minutes: Math.floor(timeUntilExpiry / 1000 / 60),
        hours: Math.floor(timeUntilExpiry / 1000 / 60 / 60),
        expiresAt: new Date(expiresAt)
      };

    } catch (error) {
      log.error('Error getting session expiry:', error);
      return null;
    }
  }

  /**
   * Clean up session manager
   */
  cleanup() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    log.debug('🧹 Session manager cleaned up');
  }
}

// Create singleton instance
const sessionManager = new SessionManager();

// Auto-initialize on load
if (typeof window !== 'undefined') {
  // Initialize after a short delay to ensure Supabase is ready
  setTimeout(() => {
    sessionManager.initialize();
  }, 1000);
}

export default sessionManager;
export { SessionManager };
