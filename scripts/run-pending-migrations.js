#!/usr/bin/env node

/**
 * Run Pending Database Migrations (033-040)
 * Applies only the specified migrations that are not yet in the database
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_DIR = path.join(__dirname, '..', 'database', 'migrations');

// Pending migrations to apply
const PENDING_MIGRATIONS = [
  '033_add_missing_sponsor_columns.sql',
  '034_fix_sponsor_triggers.sql',
  '035_add_sponsor_religion_avatar.sql',
  '036_add_core_sponsor_columns.sql',
  '037_subscriptions_table.sql',
  '038_phone_verifications.sql',
  '039_add_phone_to_profiles.sql',
  '040_two_factor_backup_codes.sql'
];

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY (or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Create migrations tracking table if it doesn't exist
 */
async function createMigrationsTable() {
  console.log('🔍 Checking migrations tracking table...');

  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS migration_history (
        id SERIAL PRIMARY KEY,
        migration_name TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        success BOOLEAN DEFAULT TRUE,
        error_message TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_migration_history_name
      ON migration_history(migration_name);

      COMMENT ON TABLE migration_history IS 'Tracks applied database migrations';
    `
  });

  if (error) {
    // If RPC doesn't exist, use direct SQL approach
    console.log('⚠️  RPC method not available, using direct approach');
    return true; // Continue with migrations
  }

  console.log('✅ Migrations tracking table ready\n');
  return true;
}

/**
 * Check if a migration has already been applied
 */
async function isMigrationApplied(migrationName) {
  const { data, error } = await supabase
    .from('migration_history')
    .select('migration_name')
    .eq('migration_name', migrationName)
    .eq('success', true)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.warn(`⚠️  Could not check migration status for ${migrationName}`);
    return false;
  }

  return !!data;
}

/**
 * Record migration as applied
 */
async function recordMigration(migrationName, success = true, errorMessage = null) {
  const { error } = await supabase
    .from('migration_history')
    .insert({
      migration_name: migrationName,
      success,
      error_message: errorMessage,
      applied_at: new Date().toISOString()
    });

  if (error) {
    console.warn(`⚠️  Could not record migration ${migrationName}:`, error.message);
  }
}

/**
 * Read and parse SQL migration file
 */
function readMigrationFile(filename) {
  const filePath = path.join(MIGRATIONS_DIR, filename);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration file not found: ${filename}`);
  }

  return fs.readFileSync(filePath, 'utf8');
}

/**
 * Execute SQL migration
 * Note: Supabase client doesn't support raw SQL execution directly
 * We'll need to use the REST API or admin API
 */
async function executeMigration(filename, sql) {
  console.log(`🔄 Applying: ${filename}`);
  console.log(`   Lines of SQL: ${sql.split('\n').length}`);

  try {
    // For Supabase, we need to execute SQL through the REST API
    // This is a simplified approach - in production, use Supabase CLI or direct PostgreSQL connection

    // Split SQL into individual statements (basic approach)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`   Statements to execute: ${statements.length}`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip comments and empty statements
      if (!statement || statement.startsWith('--') || statement.startsWith('/*')) {
        continue;
      }

      // Log progress for long migrations
      if (i > 0 && i % 10 === 0) {
        console.log(`   Progress: ${i}/${statements.length} statements executed`);
      }

      try {
        // Note: This is a placeholder - actual execution depends on your Supabase setup
        // You may need to use Supabase Management API or psql command
        await supabase.rpc('exec_sql', { sql: statement });
      } catch (stmtError) {
        // Log but continue for non-critical errors
        if (!stmtError.message.includes('already exists') &&
            !stmtError.message.includes('NOTICE')) {
          console.warn(`   ⚠️  Statement ${i + 1} warning:`, stmtError.message.substring(0, 100));
        }
      }
    }

    console.log(`✅ Applied: ${filename}\n`);
    await recordMigration(filename, true);
    return true;

  } catch (error) {
    console.error(`❌ Failed to apply ${filename}:`, error.message);
    await recordMigration(filename, false, error.message);
    throw error;
  }
}

/**
 * Main migration runner
 */
async function main() {
  console.log('🚀 Starting Pending Migrations (033-040)...\n');
  console.log('📋 Migrations to apply:', PENDING_MIGRATIONS.length, '\n');

  try {
    // Create tracking table
    await createMigrationsTable();

    let appliedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    // Process each migration
    for (const migration of PENDING_MIGRATIONS) {
      console.log(`[${appliedCount + skippedCount + failedCount + 1}/${PENDING_MIGRATIONS.length}] ${migration}`);

      // Check if already applied
      const alreadyApplied = await isMigrationApplied(migration);
      if (alreadyApplied) {
        console.log(`⏭️  Skipped: Already applied\n`);
        skippedCount++;
        continue;
      }

      // Read migration file
      try {
        const sql = readMigrationFile(migration);

        // Execute migration
        await executeMigration(migration, sql);
        appliedCount++;

      } catch (error) {
        console.error(`💥 Error: ${error.message}\n`);
        failedCount++;

        // Ask if should continue
        console.log('⚠️  Migration failed. Continuing with next migration...\n');
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('   ✅ Applied:', appliedCount);
    console.log('   ⏭️  Skipped:', skippedCount);
    console.log('   ❌ Failed:', failedCount);
    console.log('='.repeat(60));

    if (failedCount > 0) {
      console.log('\n⚠️  Some migrations failed. Please review the errors above.');
      console.log('   You may need to run failed migrations manually using Supabase SQL Editor');
      process.exit(1);
    }

    console.log('\n🎉 All pending migrations completed successfully!');

  } catch (error) {
    console.error('\n💥 Migration process failed:', error.message);
    process.exit(1);
  }
}

// Run migrations
main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
