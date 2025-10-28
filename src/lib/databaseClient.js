/**
 * Database Client - Unified interface supporting both Supabase and local database
 * Automatically switches between Supabase and local storage based on configuration
 */

import { createClient } from '@supabase/supabase-js';
import { simpleDatabase } from './simpleDatabaseClient';
import { getSecureConfig } from './secureConfig';
import { createLogger } from '@/utils/logger';

const log = createLogger('DatabaseClient');

let database;

try {
  // Get validated configuration
  const config = getSecureConfig();

  // Check if using local database mode
  const useLocalDatabase = config?.database?.useLocal !== false;

  if (useLocalDatabase) {
    // Use local storage database
    database = simpleDatabase;
    log.info('✅ Local database client initialized');
  } else {
    // Initialize Supabase client
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        'Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
      );
    }

    // Validate URL format
    if (!supabaseUrl.startsWith('http')) {
      throw new Error('Invalid VITE_SUPABASE_URL format. Must start with https://');
    }

    // Create Supabase client with optimal configuration for long-lived sessions
    database = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true, // Automatically refresh tokens
        persistSession: true, // Persist session in storage
        detectSessionInUrl: true, // Handle OAuth callbacks
        storage: window.localStorage, // Use localStorage for persistence
        storageKey: 'supabase.auth.token',
        flowType: 'pkce', // Use PKCE flow for better security
        debug: false,
        // Retry failed refresh attempts
        retryAttempts: 3,
        // Set custom token refresh margin (refresh 5 minutes before expiry)
        refreshMargin: 5 * 60, // 5 minutes in seconds
        // Store refresh token for session recovery
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      global: {
        headers: {
          'X-Client-Info': 'ethio-maids-platform'
        }
      },
      db: {
        schema: 'public'
      }
    });

    log.info('✅ Supabase client initialized successfully');
    log.debug('Connected to:', supabaseUrl);
  }

  const isDev = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');
  if (isDev) {
    log.info(`Database mode: ${useLocalDatabase ? 'Local Storage' : 'Supabase PostgreSQL'}`);
  }
} catch (error) {
  log.error('Failed to initialize database client', error);

  const isDev = (typeof process !== 'undefined' && process.env && process.env.NODE_ENV !== 'production');
  if (isDev) {
    log.warn('⚠️ Falling back to local database for development');
    database = simpleDatabase;
  } else {
    // Fail fast in production if database cannot be initialized
    throw new Error(
      'Database client initialization failed. Please check your configuration. ' +
      'This application requires a valid database connection to function properly. ' +
      'Error: ' + error.message
    );
  }
}

// Export database with Supabase-compatible API
export { database as supabase };
export default database;