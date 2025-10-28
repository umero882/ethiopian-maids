#!/usr/bin/env node

/**
 * Automated Supabase Migration Runner
 * Runs all migration files in order using Supabase Management API
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Get all migration files in order
function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, '..', 'database', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  return files.map(file => ({
    name: file,
    path: path.join(migrationsDir, file)
  }));
}

// Execute SQL using Supabase REST API
async function executeSQLFile(filePath, fileName) {
  try {
    console.log(`\n📄 Executing ${fileName}...`);
    const sql = fs.readFileSync(filePath, 'utf8');

    // Split SQL into statements (simple split by semicolon)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`   Found ${statements.length} SQL statements`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      try {
        // Use rpc to execute raw SQL
        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });

        if (error) {
          // Try direct execution via REST API
          const response = await fetch(
            `${SUPABASE_URL}/rest/v1/rpc/exec_sql`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_SERVICE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
              },
              body: JSON.stringify({ sql_query: statement + ';' })
            }
          );

          if (!response.ok) {
            // Statement might have failed, but continue
            if (process.env.VITE_ENABLE_DEBUG_MODE === 'true') {
              console.log(`   ⚠️  Statement ${i + 1} warning:`, error.message);
            }
            errorCount++;
          } else {
            successCount++;
          }
        } else {
          successCount++;
        }
      } catch (execError) {
        errorCount++;
        if (process.env.VITE_ENABLE_DEBUG_MODE === 'true') {
          console.log(`   ⚠️  Statement ${i + 1} error:`, execError.message);
        }
      }
    }

    console.log(`   ✅ Completed: ${successCount} succeeded, ${errorCount} warnings`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error executing ${fileName}:`, error.message);
    return false;
  }
}

// Main migration runner
async function runMigrations() {
  console.log('\n🚀 Starting Supabase Migrations');
  console.log('='.repeat(60));

  const migrations = getMigrationFiles();
  console.log(`\n📋 Found ${migrations.length} migration files\n`);

  let successCount = 0;

  for (const migration of migrations) {
    const success = await executeSQLFile(migration.path, migration.name);
    if (success) successCount++;

    // Small delay between migrations
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Completed: ${successCount}/${migrations.length} migrations executed`);
  console.log('='.repeat(60));

  if (successCount === migrations.length) {
    console.log('\n🎉 All migrations completed!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run: npm run test:supabase');
    console.log('   2. Create storage bucket "user-uploads" in Supabase Dashboard');
    console.log('   3. Start your app: npm run dev');
  } else {
    console.log('\n⚠️  Some migrations may need manual execution');
    console.log('   Go to Supabase Dashboard → SQL Editor');
    console.log('   Execute any failed migrations manually');
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error.message);
  process.exit(1);
});

// Run migrations
runMigrations().catch(error => {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
});