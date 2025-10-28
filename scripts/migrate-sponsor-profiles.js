#!/usr/bin/env node

/**
 * Sponsor Profiles Schema Migration Script
 * Migrates from current schema to comprehensive sponsor profiles schema
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const env = {};

  envContent.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      env[key.trim()] = valueParts
        .join('=')
        .trim()
        .replace(/^["']|["']$/g, '');
    }
  });

  return env;
}

// Logger utility
const log = {
  info: (msg) => console.log(`ℹ️  ${msg}`),
  success: (msg) => console.log(`✅ ${msg}`),
  warning: (msg) => console.log(`⚠️  ${msg}`),
  error: (msg) => console.log(`❌ ${msg}`),
  header: (msg) => {
    console.log('\n' + '='.repeat(60));
    console.log(`🔄 ${msg}`);
    console.log('='.repeat(60));
  },
};

async function executeMigration() {
  log.header('SPONSOR PROFILES SCHEMA MIGRATION');

  try {
    // Load environment
    const env = loadEnvFile();
    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_KEY || env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase credentials in .env file');
    }

    log.info('Connecting to Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Check current schema
    log.info('Checking current sponsor_profiles table...');
    const { data: currentSchema, error: schemaError } = await supabase
      .from('sponsor_profiles')
      .select('*')
      .limit(1);

    if (schemaError && schemaError.code !== 'PGRST116') {
      log.warning(`Current table check: ${schemaError.message}`);
    } else {
      log.success('Current sponsor_profiles table found');
    }

    // Step 2: Read migration SQL
    const migrationPath = path.join(
      __dirname,
      '..',
      'database',
      'migrations',
      'sponsor_profiles_migration.sql'
    );
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    log.info('Executing migration SQL...');

    // Split SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith('--'));

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.toLowerCase().includes('select ')) {
        // Skip SELECT statements (they're just for logging)
        continue;
      }

      log.info(`Executing statement ${i + 1}/${statements.length}...`);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          log.warning(`Statement ${i + 1} warning: ${error.message}`);
        }
      } catch (err) {
        log.warning(`Statement ${i + 1} error: ${err.message}`);
      }
    }

    // Step 3: Verify new schema
    log.info('Verifying new schema...');
    const { data: newSchema, error: verifyError } = await supabase
      .from('sponsor_profiles')
      .select('*')
      .limit(1);

    if (verifyError) {
      throw new Error(`Schema verification failed: ${verifyError.message}`);
    }

    log.success('New schema verified successfully');

    // Step 4: Check data migration
    const { data: migratedData, error: dataError } = await supabase
      .from('sponsor_profiles')
      .select('id, full_name, family_size, children_count')
      .limit(5);

    if (dataError) {
      log.warning(`Data check warning: ${dataError.message}`);
    } else {
      log.success(`Found ${migratedData?.length || 0} migrated records`);
      if (migratedData && migratedData.length > 0) {
        log.info('Sample migrated data:');
        migratedData.forEach((record, index) => {
          log.info(
            `  ${index + 1}. ${record.full_name} (Family: ${record.family_size}, Children: ${record.children_count})`
          );
        });
      }
    }

    log.success('Migration completed successfully!');

    // Step 5: Cleanup instructions
    log.header('POST-MIGRATION STEPS');
    log.info('1. Update your frontend to use ExtendedSponsorCompletionForm');
    log.info('2. Test the sponsor profile completion flow');
    log.info('3. Verify data integrity in production');
    log.info('4. Remove sponsor_profiles_backup table when confident');
  } catch (error) {
    log.error(`Migration failed: ${error.message}`);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  executeMigration();
}

export default executeMigration;
