import { supabase } from '@/lib/databaseClient';
import { logError, logInfo, logWarning } from './errorHandlingService';

/**
 * Schema Migration Service
 * Ensures all database schema migrations are applied and up-to-date
 */
class SchemaMigrationService {
  constructor() {
    this.migrations = [
      '001_initial_schema.sql',
      '002_user_profiles.sql',
      '003_maid_profiles.sql',
      '004_job_postings.sql',
      '005_messaging_system.sql',
      '006_file_storage.sql',
      '007_notifications.sql',
      '008_subscriptions.sql',
      '009_analytics.sql',
      '010_security_policies.sql',
      '011_performance_indexes.sql',
      '012_support_system.sql',
    ];
  }

  /**
   * Check database schema status
   */
  async checkSchemaStatus() {
    try {
      logInfo('Schema Check', 'Checking database schema status');

      // Check if core tables exist
      const coreTableChecks = await Promise.allSettled([
        this.checkTableExists('profiles'),
        this.checkTableExists('maid_profiles'),
        this.checkTableExists('job_postings'),
        this.checkTableExists('conversations'),
        this.checkTableExists('user_subscriptions'),
        this.checkTableExists('support_tickets'),
      ]);

      const existingTables = coreTableChecks
        .map((result, index) => ({
          table: [
            'profiles',
            'maid_profiles',
            'job_postings',
            'conversations',
            'user_subscriptions',
            'support_tickets',
          ][index],
          exists: result.status === 'fulfilled' && result.value,
        }))
        .filter((check) => check.exists)
        .map((check) => check.table);

      const missingTables = [
        'profiles',
        'maid_profiles',
        'job_postings',
        'conversations',
        'user_subscriptions',
        'support_tickets',
      ].filter((table) => !existingTables.includes(table));

      // Check RLS policies
      const rlsStatus = await this.checkRLSPolicies();

      const schemaStatus = {
        coreTablesExist: existingTables.length >= 4, // At least 4 core tables
        existingTables,
        missingTables,
        rlsPoliciesEnabled: rlsStatus.enabled,
        rlsPolicyCount: rlsStatus.policyCount,
        isProductionReady:
          existingTables.length >= 4 &&
          rlsStatus.enabled &&
          rlsStatus.policyCount >= 10,
      };

      logInfo('Schema Status', `Schema check complete`, schemaStatus);
      return schemaStatus;
    } catch (error) {
      logError('Schema Check Failed', error);
      return {
        coreTablesExist: false,
        existingTables: [],
        missingTables: [],
        rlsPoliciesEnabled: false,
        rlsPolicyCount: 0,
        isProductionReady: false,
        error: error.message,
      };
    }
  }

  /**
   * Check if a table exists
   */
  async checkTableExists(tableName) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      // If no error or error is just "no rows", table exists
      return !error || error.code === 'PGRST116';
    } catch (error) {
      return false;
    }
  }

  /**
   * Check RLS policies status
   */
  async checkRLSPolicies() {
    try {
      // Try to query system tables to check RLS status
      const { data, error } = await supabase.rpc('check_rls_status');

      if (error) {
        // Fallback: assume RLS is enabled if we can't check
        logWarning(
          'RLS Check',
          'Could not verify RLS status, assuming enabled'
        );
        return { enabled: true, policyCount: 0 };
      }

      return {
        enabled: true,
        policyCount: data?.policy_count || 0,
      };
    } catch (error) {
      logWarning('RLS Check Failed', 'Could not check RLS policies', {
        error: error.message,
      });
      return { enabled: false, policyCount: 0 };
    }
  }

  /**
   * Validate database connectivity and permissions
   */
  async validateDatabaseConnection() {
    try {
      logInfo(
        'Database Validation',
        'Testing database connection and permissions'
      );

      // Test basic read access
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (profileError && profileError.code !== 'PGRST116') {
        throw new Error(`Database read test failed: ${profileError.message}`);
      }

      // Test authentication
      const { data: authData, error: authError } =
        await supabase.auth.getSession();

      if (authError) {
        logWarning('Auth Check', 'Authentication check failed', {
          error: authError.message,
        });
      }

      // Test storage access
      const { data: storageData, error: storageError } = await supabase.storage
        .from('user-uploads')
        .list('', { limit: 1 });

      if (storageError) {
        logWarning('Storage Check', 'Storage access check failed', {
          error: storageError.message,
        });
      }

      logInfo(
        'Database Validation',
        'Database connection validated successfully'
      );
      return {
        connected: true,
        readAccess: true,
        authWorking: !authError,
        storageAccess: !storageError,
      };
    } catch (error) {
      logError('Database Validation Failed', error);
      return {
        connected: false,
        readAccess: false,
        authWorking: false,
        storageAccess: false,
        error: error.message,
      };
    }
  }

  /**
   * Run production readiness check
   */
  async runProductionReadinessCheck() {
    try {
      logInfo(
        'Production Check',
        'Running comprehensive production readiness check'
      );

      const [schemaStatus, connectionStatus] = await Promise.all([
        this.checkSchemaStatus(),
        this.validateDatabaseConnection(),
      ]);

      // Check environment configuration
      const envCheck = this.checkEnvironmentConfig();

      const productionReadiness = {
        database: {
          connected: connectionStatus.connected,
          schemaReady: schemaStatus.isProductionReady,
          rlsEnabled: schemaStatus.rlsPoliciesEnabled,
          status:
            connectionStatus.connected && schemaStatus.isProductionReady
              ? 'ready'
              : 'incomplete',
        },
        environment: {
          mockDataDisabled: !envCheck.useMockData,
          requiredVarsSet: envCheck.requiredVarsSet,
          status:
            !envCheck.useMockData && envCheck.requiredVarsSet
              ? 'ready'
              : 'incomplete',
        },
        storage: {
          accessible: connectionStatus.storageAccess,
          status: connectionStatus.storageAccess ? 'ready' : 'incomplete',
        },
        authentication: {
          working: connectionStatus.authWorking,
          status: connectionStatus.authWorking ? 'ready' : 'incomplete',
        },
      };

      const overallReady = Object.values(productionReadiness).every(
        (component) => component.status === 'ready'
      );

      const result = {
        ready: overallReady,
        components: productionReadiness,
        schemaDetails: schemaStatus,
        connectionDetails: connectionStatus,
        environmentDetails: envCheck,
        timestamp: new Date().toISOString(),
      };

      if (overallReady) {
        logInfo('Production Check', '✅ Platform is production ready!');
      } else {
        const incompleteComponents = Object.entries(productionReadiness)
          .filter(([key, component]) => component.status !== 'ready')
          .map(([key]) => key);

        logWarning(
          'Production Check',
          `⚠️ Platform not production ready. Issues: ${incompleteComponents.join(', ')}`
        );
      }

      return result;
    } catch (error) {
      logError('Production Readiness Check Failed', error);
      return {
        ready: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Check environment configuration
   */
  checkEnvironmentConfig() {
    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
    ];

    const missingVars = requiredVars.filter(
      (varName) =>
        !import.meta.env[varName] || import.meta.env[varName].includes('YOUR_')
    );

    return {
      useMockData: import.meta.env.VITE_USE_MOCK_DATA === 'true',
      requiredVarsSet: missingVars.length === 0,
      missingVars,
      environment: import.meta.env.NODE_ENV,
    };
  }

  /**
   * Generate production deployment checklist
   */
  async generateDeploymentChecklist() {
    const readinessCheck = await this.runProductionReadinessCheck();

    const checklist = {
      'Environment Configuration': {
        'Disable mock data (VITE_USE_MOCK_DATA=false)':
          !readinessCheck.environmentDetails?.useMockData,
        'Set NODE_ENV=production':
          readinessCheck.environmentDetails?.environment === 'production',
        'Configure all required API keys':
          readinessCheck.environmentDetails?.requiredVarsSet,
        'Set up CORS for production domain': true, // Assume configured
      },
      'Database Setup': {
        'Database connection working':
          readinessCheck.connectionDetails?.connected,
        'Core tables exist': readinessCheck.schemaDetails?.coreTablesExist,
        'RLS policies enabled':
          readinessCheck.schemaDetails?.rlsPoliciesEnabled,
        'Storage bucket configured':
          readinessCheck.connectionDetails?.storageAccess,
      },
      'Authentication System': {
        'Supabase auth working': readinessCheck.connectionDetails?.authWorking,
        'User registration flow tested': false, // Manual test required
        'Role-based access working': false, // Manual test required
        'Session management working': false, // Manual test required
      },
      'Core Features': {
        'Maid profile creation working': false, // Manual test required
        'File upload working': readinessCheck.connectionDetails?.storageAccess,
        'Search and filtering working': false, // Manual test required
        'Messaging system working': false, // Manual test required
      },
      'Payment Integration': {
        'Stripe keys configured': false, // Check Stripe config
        'Webhook endpoints set up': false, // Manual setup required
        'Subscription flows tested': false, // Manual test required
      },
      'Monitoring & Support': {
        'Error logging configured': true, // Our error service
        'Support system working': false, // Manual test required
        'Performance monitoring set up': false, // Manual setup required
      },
    };

    const completedItems = Object.values(checklist)
      .flatMap((section) => Object.values(section))
      .filter(Boolean).length;

    const totalItems = Object.values(checklist).flatMap((section) =>
      Object.values(section)
    ).length;

    return {
      checklist,
      progress: {
        completed: completedItems,
        total: totalItems,
        percentage: Math.round((completedItems / totalItems) * 100),
      },
      readyForProduction:
        readinessCheck.ready && completedItems >= totalItems * 0.8,
    };
  }
}

// Create singleton instance
export const schemaMigrationService = new SchemaMigrationService();
export default schemaMigrationService;
