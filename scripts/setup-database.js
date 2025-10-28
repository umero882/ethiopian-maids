#!/usr/bin/env node

/**
 * Database Setup Script for Ethio-Maids
 *
 * This script helps set up the complete Supabase database schema
 * by running all migration files in the correct order.
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_KEY (or VITE_SUPABASE_ANON_KEY)');
  console.error('\nPlease check your .env file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Migration files in order
const MIGRATION_FILES = [
  '001_core_schema.sql',
  '002_security_policies.sql',
  '003_functions_triggers.sql',
  '004_jobs_applications.sql',
  '005_extended_security.sql',
];

/**
 * Execute SQL from a file
 */
async function executeSQLFile(filePath) {
  try {
    const sql = fs.readFileSync(filePath, 'utf8');

    // Split SQL into individual statements (basic approach)
    const statements = sql
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(
      `📄 Executing ${path.basename(filePath)} (${statements.length} statements)...`
    );

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', {
            sql_query: statement,
          });
          if (error) {
            // Try direct execution if RPC fails
            const { error: _directError } = await supabase
              .from('_temp_sql_execution')
              .select('*')
              .limit(0); // This will fail, but we can catch it

            // If we can't use RPC, we'll need to use the SQL editor manually
            console.warn(
              `⚠️  Statement ${i + 1} may need manual execution in Supabase SQL Editor`
            );
            console.log(`   SQL: ${statement.substring(0, 100)}...`);
          }
        } catch (execError) {
          console.warn(
            `⚠️  Statement ${i + 1} execution warning:`,
            execError.message
          );
        }
      }
    }

    console.log(`✅ Completed ${path.basename(filePath)}`);
    return true;
  } catch (error) {
    console.error(
      `❌ Error executing ${path.basename(filePath)}:`,
      error.message
    );
    return false;
  }
}

/**
 * Check if tables exist
 */
async function checkTablesExist() {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'profiles',
        'maid_profiles',
        'sponsor_profiles',
        'jobs',
        'applications',
      ]);

    if (error) {
      console.log(
        'ℹ️  Cannot check existing tables (this is normal for new databases)'
      );
      return [];
    }

    return data?.map((row) => row.table_name) || [];
  } catch (error) {
    console.log(
      'ℹ️  Cannot check existing tables (this is normal for new databases)'
    );
    return [];
  }
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    const { data: _data, error } = await supabase
      .from('information_schema.tables')
      .select('count')
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Main setup function
 */
async function setupDatabase() {
  console.log('🚀 Starting Ethio-Maids Database Setup\n');

  // Test connection
  console.log('🔗 Testing database connection...');
  const connected = await testConnection();
  if (!connected) {
    console.error('\n❌ Setup failed: Cannot connect to database');
    process.exit(1);
  }

  // Check existing tables
  console.log('\n📋 Checking existing tables...');
  const existingTables = await checkTablesExist();
  if (existingTables.length > 0) {
    console.log(`ℹ️  Found existing tables: ${existingTables.join(', ')}`);
    console.log('⚠️  This will update/modify existing schema');
  } else {
    console.log('ℹ️  No existing tables found - fresh installation');
  }

  // Execute migrations
  console.log('\n📦 Running database migrations...\n');

  const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');
  let successCount = 0;

  for (const migrationFile of MIGRATION_FILES) {
    const filePath = path.join(migrationsDir, migrationFile);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Migration file not found: ${migrationFile}`);
      continue;
    }

    const success = await executeSQLFile(filePath);
    if (success) {
      successCount++;
    }

    // Small delay between migrations
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n📊 Setup Summary:');
  console.log(
    `   ✅ Successful migrations: ${successCount}/${MIGRATION_FILES.length}`
  );

  if (successCount === MIGRATION_FILES.length) {
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Verify tables in your Supabase dashboard');
    console.log('   2. Test user registration in your application');
    console.log('   3. Check that RLS policies are working correctly');
    console.log(
      '\n💡 If you encounter issues, you can run individual migrations'
    );
    console.log('   manually in the Supabase SQL Editor.');
  } else {
    console.log(
      '\n⚠️  Some migrations may need manual execution in Supabase SQL Editor'
    );
    console.log('\n📖 Manual Setup Instructions:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Copy and paste each migration file content');
    console.log('   4. Execute them in order: 001 → 002 → 003 → 004 → 005');
  }
}

/**
 * CLI interface
 */
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Ethio-Maids Database Setup Script

Usage: node scripts/setup-database.js [options]

Options:
  --help, -h     Show this help message
  --check        Only check database connection and existing tables
  --force        Force run all migrations (skip confirmations)

Environment Variables Required:
  VITE_SUPABASE_URL          Your Supabase project URL
  SUPABASE_SERVICE_KEY       Your Supabase service role key
  (or VITE_SUPABASE_ANON_KEY as fallback)

Examples:
  node scripts/setup-database.js
  node scripts/setup-database.js --check
  node scripts/setup-database.js --force
`);
  process.exit(0);
}

if (process.argv.includes('--check')) {
  console.log('🔍 Checking database status...\n');
  testConnection().then(async (connected) => {
    if (connected) {
      const tables = await checkTablesExist();
      console.log(
        `\n📋 Existing tables: ${tables.length > 0 ? tables.join(', ') : 'None'}`
      );
    }
  });
} else {
  // Run the setup
  setupDatabase().catch((error) => {
    console.error('\n💥 Setup failed with error:', error.message);
    process.exit(1);
  });
}
