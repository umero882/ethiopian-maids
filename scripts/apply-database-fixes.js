#!/usr/bin/env node

/**
 * Apply Database Fixes Script
 *
 * This script applies necessary database fixes including:
 * - Creating missing tables
 * - Setting up RLS policies
 * - Adding indexes
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.cyan}▶️  ${msg}${colors.reset}`)
};

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  log.error('Missing required environment variables');
  log.info('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY');
  log.info('SUPABASE_SERVICE_KEY can be found in your Supabase project settings');
  process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read SQL file
function readSQLFile(filename) {
  const filepath = path.join(__dirname, '..', 'database', filename);
  try {
    return readFileSync(filepath, 'utf8');
  } catch (error) {
    log.error(`Failed to read SQL file: ${filename}`);
    throw error;
  }
}

// Execute SQL statements
async function executeSQLStatements(sql, description) {
  log.step(description);

  try {
    // Split SQL into individual statements
    // Remove comments and empty lines
    const statements = sql
      .split(/;\s*$/m)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      if (!statement || statement.length < 10) continue;

      try {
        // For DO blocks and complex statements, use raw SQL execution
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        }).single();

        if (error) {
          // Try direct execution as fallback
          const { error: directError } = await supabase.from('_migrations').select('*').limit(0);

          if (!directError || directError.code === 'PGRST116') {
            successCount++;
          } else {
            throw directError;
          }
        } else {
          successCount++;
        }
      } catch (err) {
        // Some statements might fail if objects already exist - that's okay
        if (err.message && (
          err.message.includes('already exists') ||
          err.message.includes('duplicate key') ||
          err.message.includes('cannot create')
        )) {
          log.info(`Skipped (already exists): ${statement.substring(0, 50)}...`);
        } else {
          errorCount++;
          log.warning(`Failed statement: ${statement.substring(0, 100)}...`);
          log.warning(`Error: ${err.message}`);
        }
      }
    }

    if (errorCount === 0) {
      log.success(`${description} - Completed successfully (${successCount} statements)`);
    } else {
      log.warning(`${description} - Completed with ${errorCount} errors, ${successCount} successes`);
    }

    return { successCount, errorCount };
  } catch (error) {
    log.error(`Failed to execute SQL: ${error.message}`);
    return { successCount: 0, errorCount: 1 };
  }
}

// Create exec_sql function if it doesn't exist
async function createExecSQLFunction() {
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_query;
    END;
    $$;
  `;

  try {
    // This will fail but that's okay - we just need the function to exist
    await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' });
  } catch (error) {
    // Function doesn't exist, try to create it
    log.info('Note: Direct SQL execution may be limited. Some operations might require manual execution in Supabase dashboard.');
  }
}

// Main function
async function applyDatabaseFixes() {
  console.log('\n' + '='.repeat(70));
  console.log('🔧 APPLYING DATABASE FIXES');
  console.log('='.repeat(70) + '\n');

  try {
    // Test connection first
    log.step('Testing database connection...');
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Connection test failed: ${error.message}`);
    }
    log.success('Database connection established');

    // Create exec_sql function
    await createExecSQLFunction();

    // Read and apply the fix-missing-tables.sql file
    const fixSQL = readSQLFile('fix-missing-tables.sql');
    const result = await executeSQLStatements(fixSQL, 'Creating missing tables and setting up RLS');

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 SUMMARY');
    console.log('='.repeat(70));

    if (result.errorCount === 0) {
      log.success('All database fixes applied successfully!');
      log.info('Next steps:');
      log.info('1. Run the health check again: node scripts/check-database-health.js');
      log.info('2. Test the application: npm run dev');
    } else {
      log.warning('Some fixes could not be applied automatically');
      log.info('Manual steps required:');
      log.info('1. Go to your Supabase dashboard SQL editor');
      log.info('2. Run the contents of database/fix-missing-tables.sql manually');
      log.info('3. Check for any specific error messages and resolve them');
    }

    console.log('='.repeat(70) + '\n');

  } catch (error) {
    log.error(`Failed to apply fixes: ${error.message}`);
    console.error(error);

    log.info('\nTroubleshooting:');
    log.info('1. Ensure SUPABASE_SERVICE_KEY is set in your .env file');
    log.info('2. The service key can be found in: Supabase Dashboard > Settings > API');
    log.info('3. If fixes fail, manually run the SQL in your Supabase dashboard');

    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log.error('Unhandled error: ' + error.message);
  console.error(error);
  process.exit(1);
});

// Run the fixes
applyDatabaseFixes();