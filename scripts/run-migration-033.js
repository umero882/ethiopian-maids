#!/usr/bin/env node

/**
 * Run Migration 033: Add Missing Sponsor Profile Columns
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('\n🚀 Running Migration 033: Add Missing Sponsor Profile Columns\n');

  try {
    // Read migration file
    const migrationPath = join(__dirname, '..', 'database', 'migrations', '033_add_missing_sponsor_columns.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📝 Executing migration SQL...\n');

    // Execute migration via Supabase SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSQL
    });

    if (error) {
      // Try direct execution if RPC doesn't exist
      console.log('⚠️  RPC method not available, attempting direct execution...\n');

      // Split by statement and execute each
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement) {
          const { error: stmtError } = await supabase.rpc('exec', {
            query: statement + ';'
          });

          if (stmtError) {
            console.error(`❌ Error executing statement: ${stmtError.message}`);
            console.error(`Statement: ${statement.substring(0, 100)}...`);
          }
        }
      }
    }

    console.log('\n✅ Migration 033 completed successfully!\n');
    console.log('📋 Next steps:');
    console.log('   1. Go to Supabase Dashboard → Settings → API');
    console.log('   2. Click "Reload Schema Cache"');
    console.log('   3. Verify columns exist in sponsor_profiles table\n');

  } catch (err) {
    console.error('\n❌ Migration failed:', err.message);
    console.error('\n📝 Manual execution required:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Copy the SQL from: database/migrations/033_add_missing_sponsor_columns.sql');
    console.log('   3. Run it directly in the SQL Editor');
    console.log('   4. Reload schema cache\n');
    process.exit(1);
  }
}

runMigration();
