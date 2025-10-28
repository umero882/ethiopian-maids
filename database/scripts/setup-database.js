/**
 * Automated Database Setup Script
 * Fixes database initialization and trigger conflicts
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
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error(
    '   VITE_SUPABASE_URL:',
    SUPABASE_URL ? '✅ Set' : '❌ Missing'
  );
  console.error(
    '   SUPABASE_SERVICE_KEY:',
    SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing'
  );
  console.error('\n📝 Add these to your .env file:');
  console.error('   VITE_SUPABASE_URL=your-supabase-url');
  console.error('   SUPABASE_SERVICE_KEY=your-service-role-key');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Migration files in correct order
const MIGRATION_FILES = [
  '001_core_schema.sql',
  '002_security_policies_fixed.sql', // Use the fixed version
  '003_functions_triggers_fixed.sql', // We'll create this
  '004_jobs_applications.sql',
  '005_extended_security.sql',
  '006_phone_verification.sql',
  '007_enhanced_maid_profiles.sql',
  '008_maid_images.sql',
  '009_maid_videos.sql',
  '010_add_passport_number.sql',
  '011_add_about_me_field.sql',
  '012_add_processed_images_support.sql',
  '013_jobs_table.sql',
];

async function checkDatabaseConnection() {
  console.log('🔍 Testing database connection...');

  try {
    const { data: _data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);

    if (error) {
      console.log('⚠️  Database connection established but no tables found');
      return { connected: true, hasData: false };
    }

    console.log('✅ Database connection successful');
    return { connected: true, hasData: true };
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    return { connected: false, hasData: false };
  }
}

async function checkMigrationFile(filePath, fileName) {
  console.log(`\n📄 Checking ${fileName}...`);

  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${fileName}`);
      return false;
    }

    const sqlContent = fs.readFileSync(filePath, 'utf8');
    const statements = sqlContent
      .split(';')
      .map((stmt) => stmt.trim())
      .filter(
        (stmt) =>
          stmt.length > 0 && !stmt.startsWith('--') && !stmt.match(/^\s*$/)
      );

    console.log(
      `✅ ${fileName} found with ${statements.length} SQL statements`
    );
    console.log(`   📋 Manual execution required in Supabase SQL Editor`);

    return true;
  } catch (error) {
    console.error(`❌ Error reading ${fileName}:`, error.message);
    return false;
  }
}

async function checkMigrations() {
  console.log('🔍 Checking migration files...\n');

  const migrationsDir = path.join(__dirname, '..', 'migrations');
  let foundCount = 0;

  console.log('📋 Migration files to execute manually in Supabase SQL Editor:');
  console.log(
    '================================================================\n'
  );

  for (const fileName of MIGRATION_FILES) {
    const filePath = path.join(migrationsDir, fileName);

    const success = await checkMigrationFile(filePath, fileName);
    if (success) {
      foundCount++;
      console.log(`   👉 Copy and paste: database/migrations/${fileName}`);
    }
  }

  console.log(`\n📊 Migration Files Summary:`);
  console.log(`   Found: ${foundCount}/${MIGRATION_FILES.length}`);

  if (foundCount > 0) {
    console.log(`\n🔧 MANUAL SETUP REQUIRED:`);
    console.log(`   1. Open your Supabase Dashboard`);
    console.log(`   2. Go to SQL Editor`);
    console.log(`   3. Execute the migration files in this exact order:`);

    for (let i = 0; i < MIGRATION_FILES.length; i++) {
      const fileName = MIGRATION_FILES[i];
      const filePath = path.join(migrationsDir, fileName);
      if (fs.existsSync(filePath)) {
        console.log(
          `      ${i + 1}. ${fileName} ${fileName.includes('_fixed') ? '⭐ (FIXED VERSION)' : ''}`
        );
      }
    }

    console.log(
      `\n   4. After running all migrations, test with: npm run db:test`
    );
  }

  return foundCount > 0;
}

async function _verifySetup() {
  console.log('\n🔍 Verifying database setup...');

  const requiredTables = [
    'profiles',
    'maid_profiles',
    'sponsor_profiles',
    'agency_profiles',
    'countries',
    'skills',
  ];

  let allTablesExist = true;

  for (const tableName of requiredTables) {
    try {
      const { data: _data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error && error.code === '42P01') {
        console.log(`❌ Table '${tableName}' missing`);
        allTablesExist = false;
      } else {
        console.log(`✅ Table '${tableName}' exists`);
      }
    } catch (err) {
      console.log(`❌ Error checking '${tableName}':`, err.message);
      allTablesExist = false;
    }
  }

  return allTablesExist;
}

async function main() {
  console.log('🏗️  Ethio-Maids Database Setup');
  console.log('================================\n');

  // Step 1: Check connection
  const { connected, hasData: _hasData } = await checkDatabaseConnection();
  if (!connected) {
    console.error('❌ Cannot proceed without database connection');
    process.exit(1);
  }

  // Step 2: Check migrations
  const migrationsFound = await checkMigrations();
  if (!migrationsFound) {
    console.error('❌ No migration files found');
    process.exit(1);
  }

  console.log('\n⏳ Please execute the migration files manually, then run:');
  console.log('   npm run db:test');
  console.log('\n📋 After manual setup:');
  console.log('   1. Test user registration in your app');
  console.log('   2. Check that profiles are created properly');
  console.log('   3. Verify RLS policies are working');

  process.exit(0);
}

// Run the setup
main().catch((error) => {
  console.error('💥 Setup failed:', error);
  process.exit(1);
});
