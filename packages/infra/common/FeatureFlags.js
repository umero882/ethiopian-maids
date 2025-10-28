/**
 * FeatureFlags - Feature flag service for gradual rollouts
 *
 * Supports environment-based and database-backed feature flags.
 */

export class FeatureFlags {
  constructor(supabaseClient = null) {
    this.supabase = supabaseClient;
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Check if feature is enabled
   */
  async isEnabled(flagName, context = {}) {
    // 1. Check environment variable first (highest priority)
    const envValue = this._getEnvFlag(flagName);
    if (envValue !== undefined) {
      return envValue;
    }

    // 2. Check cache
    const cached = this._getCached(flagName);
    if (cached !== null) {
      return cached.value;
    }

    // 3. Check database
    if (this.supabase) {
      const dbValue = await this._getDbFlag(flagName, context);
      if (dbValue !== null) {
        this._setCache(flagName, dbValue);
        return dbValue;
      }
    }

    // 4. Default to false
    return false;
  }

  /**
   * Get flag from environment variables
   */
  _getEnvFlag(flagName) {
    const envKey = `VITE_FF_${flagName.toUpperCase().replace(/\./g, '_')}`;
    const value = import.meta?.env?.[envKey] || process.env?.[envKey];

    if (value === undefined) return undefined;

    // Parse boolean values
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;

    return undefined;
  }

  /**
   * Get flag from database with context-based rules
   */
  async _getDbFlag(flagName, context) {
    try {
      const { data, error } = await this.supabase
        .from('feature_flags')
        .select('*')
        .eq('name', flagName)
        .eq('enabled', true)
        .single();

      if (error || !data) return null;

      // Check rollout percentage
      if (data.rollout_percentage < 100) {
        const userHash = this._hashContext(context);
        if (userHash % 100 >= data.rollout_percentage) {
          return false;
        }
      }

      // Check user/role targeting
      if (data.target_users?.length > 0 && context.userId) {
        if (!data.target_users.includes(context.userId)) {
          return false;
        }
      }

      if (data.target_roles?.length > 0 && context.role) {
        if (!data.target_roles.includes(context.role)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error(`Failed to fetch feature flag ${flagName}:`, error);
      return null;
    }
  }

  /**
   * Hash context for consistent percentage rollout
   */
  _hashContext(context) {
    const key = context.userId || context.sessionId || 'anonymous';
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Cache management
   */
  _getCached(flagName) {
    const cached = this.cache.get(flagName);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.cacheTTL) {
      this.cache.delete(flagName);
      return null;
    }

    return cached;
  }

  _setCache(flagName, value) {
    this.cache.set(flagName, {
      value,
      timestamp: Date.now(),
    });
  }

  /**
   * Clear cache (call when flags are updated)
   */
  clearCache() {
    this.cache.clear();
  }
}

/**
 * Feature flag constants
 */
export const FLAGS = {
  NEW_IDENTITY_MODULE: 'identity.new_module',
  NEW_PROFILES_MODULE: 'profiles.new_module',
  NEW_JOBS_MODULE: 'jobs.new_module',
  NEW_SUBSCRIPTIONS_MODULE: 'subscriptions.new_module',
  RTL_SUPPORT: 'ui.rtl_support',
  ENHANCED_SEARCH: 'search.enhanced',
  PREDICTIVE_ANALYTICS: 'analytics.predictive',
  VIDEO_CALLS: 'communications.video_calls',
};

/**
 * Create feature flags table (run once)
 */
export const createFeatureFlagsTable = `
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT FALSE,
  rollout_percentage INTEGER DEFAULT 100 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  target_users TEXT[],
  target_roles TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_name ON feature_flags(name);
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);

-- Insert default flags
INSERT INTO feature_flags (name, description, enabled, rollout_percentage) VALUES
  ('identity.new_module', 'Use new identity module with DDD', false, 0),
  ('profiles.new_module', 'Use new profiles module', false, 0),
  ('jobs.new_module', 'Use new jobs module', false, 0),
  ('ui.rtl_support', 'Enable RTL support for Arabic', true, 100),
  ('search.enhanced', 'Enhanced search with facets', false, 50)
ON CONFLICT (name) DO NOTHING;
`;
