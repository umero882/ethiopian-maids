/**
 * Configuration Check Utility
 * Validates that all required environment variables are properly configured
 */

/**
 * Check all required configurations
 * @returns {Object} Complete configuration status
 */
export function checkAllConfigurations() {
  const databaseConfig = {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };

  return {
    supabase: {
      isConfigured: !!(databaseConfig.url && databaseConfig.anonKey),
      config: {
        url: databaseConfig.url
          ? `${databaseConfig.url.substring(0, 20)}...`
          : 'Not set',
        anonKey: databaseConfig.anonKey
          ? `${databaseConfig.anonKey.substring(0, 20)}...`
          : 'Not set',
      },
    },
    mockData: {
      enabled: import.meta.env.VITE_USE_MOCK_DATA === 'true',
    },
  };
}

/**
 * Log configuration status to console
 */
export function logConfigurationStatus() {
  const config = checkAllConfigurations();

  console.group('🔧 Configuration Status');

  // Supabase Configuration
  console.group('🗄️ Supabase');
  /* console.log(
    'Status:',
    config.supabase.isConfigured ? '✅ Configured' : '❌ Not Configured'
  ); */
  console.groupEnd();

  // Mock Data
  console.group('🎭 Mock Data');
  console.groupEnd();

  console.groupEnd();

  return config;
}

// Auto-run configuration check in development
if (import.meta.env.DEV) {
  // Delay to ensure environment is loaded
  setTimeout(() => {
    logConfigurationStatus();
  }, 1000);
}
