/**
 * Node.js Database Diagnostic Script
 * Checks current database state and provides migration guidance
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../../.env');

dotenv.config({ path: envPath });

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('   VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log(
    '   VITE_SUPABASE_ANON_KEY:',
    supabaseKey ? '✅ Set' : '❌ Missing'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const runDatabaseDiagnostic = async () => {
  console.log('🔍 Database Diagnostic Report\n');
  console.log('=====================================\n');

  try {
    // Test 1: Check Supabase connection
    console.log('1️⃣ Testing Supabase Connection...');
    console.log(`   URL: ${supabaseUrl}`);
    console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);

    const {
      data: { session: _session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) {
      console.log('⚠️  Auth session error (expected):', sessionError.message);
    }
    console.log('✅ Supabase client initialized successfully\n');

    // Test 2: Check which tables exist
    console.log('2️⃣ Checking existing tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.error('❌ Cannot query tables:', tablesError.message);
      console.log('   Error code:', tablesError.code);
      console.log('   This usually means no migrations have been run yet.\n');

      if (tablesError.code === 'PGRST301') {
        console.log(
          '   → RLS is blocking access - tables might exist but need proper policies'
        );
      }
    } else {
      const tableNames = tables.map((t) => t.table_name);
      console.log('   Found tables:', tableNames.join(', '));

      // Check for required tables
      const requiredTables = [
        'profiles',
        'maid_profiles',
        'sponsor_profiles',
        'agency_profiles',
        'countries',
        'skills',
      ];
      const missingTables = requiredTables.filter(
        (table) => !tableNames.includes(table)
      );

      if (missingTables.length === 0) {
        console.log('✅ All core tables exist');
      } else {
        console.log('❌ Missing tables:', missingTables.join(', '));
        console.log('   → You need to run migration 001 first\n');
      }
    }

    // Test 3: Check specific table structure
    console.log('3️⃣ Checking table access...');
    const tablesToCheck = ['profiles', 'countries', 'skills'];

    for (const tableName of tablesToCheck) {
      try {
        const { data: _data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          if (error.code === '42P01') {
            console.log(`❌ Table '${tableName}' does not exist`);
          } else if (error.code === 'PGRST301') {
            console.log(
              `⚠️  Table '${tableName}' exists but RLS is blocking access (expected)`
            );
          } else {
            console.log(
              `❌ Error accessing '${tableName}':`,
              error.message,
              `(${error.code})`
            );
          }
        } else {
          console.log(`✅ Table '${tableName}' accessible`);
        }
      } catch (err) {
        console.log(`❌ Error checking '${tableName}':`, err.message);
      }
    }

    // Test 4: Check for sample data (public access)
    console.log('\n4️⃣ Checking reference data...');

    // Try to check countries - this should be publicly accessible after migration 002
    try {
      const { data: countriesCount, error: countriesError } = await supabase
        .from('countries')
        .select('*', { count: 'exact', head: true });

      if (countriesError) {
        console.log(
          '❌ Cannot access countries table:',
          countriesError.message,
          `(${countriesError.code})`
        );
        if (countriesError.code === '42P01') {
          console.log(
            '   → Countries table does not exist - run migration 001'
          );
        } else if (countriesError.code === 'PGRST301') {
          console.log(
            '   → Countries table exists but needs migration 002 (security policies)'
          );
        }
      } else {
        console.log(
          `✅ Countries table accessible with ${countriesCount} records`
        );
      }
    } catch (err) {
      console.log('❌ Error checking countries data:', err.message);
    }

    try {
      const { data: skillsCount, error: skillsError } = await supabase
        .from('skills')
        .select('*', { count: 'exact', head: true });

      if (skillsError) {
        console.log(
          '❌ Cannot access skills table:',
          skillsError.message,
          `(${skillsError.code})`
        );
        if (skillsError.code === '42P01') {
          console.log('   → Skills table does not exist - run migration 001');
        } else if (skillsError.code === 'PGRST301') {
          console.log(
            '   → Skills table exists but needs migration 002 (security policies)'
          );
        }
      } else {
        console.log(`✅ Skills table accessible with ${skillsCount} records`);
      }
    } catch (err) {
      console.log('❌ Error checking skills data:', err.message);
    }

    // Provide recommendations
    console.log('\n📋 DIAGNOSTIC SUMMARY');
    console.log('=====================================');

    if (tablesError && tablesError.code === '42P01') {
      console.log('🔧 RECOMMENDED ACTION: Run Migration 001');
      console.log('   Status: No tables found - database is empty');
      console.log(
        '   Next Step: Run 001_core_schema.sql in Supabase SQL Editor'
      );
      console.log('   File: database/migrations/001_core_schema.sql');
    } else if (tablesError && tablesError.code === 'PGRST301') {
      console.log('🔧 RECOMMENDED ACTION: Check Migration Status');
      console.log('   Status: Tables might exist but RLS is blocking access');
      console.log('   This could mean:');
      console.log(
        '   • Migration 001 complete, but Migration 002 needs to be run'
      );
      console.log('   • Migrations are complete but you need to authenticate');
      console.log(
        '   Next Step: Check Supabase dashboard or run migrations 001 & 002'
      );
    } else if (tables && tables.length > 0) {
      const requiredTables = [
        'profiles',
        'maid_profiles',
        'sponsor_profiles',
        'agency_profiles',
        'countries',
        'skills',
      ];
      const existingTables = tables.map((t) => t.table_name);
      const missingTables = requiredTables.filter(
        (table) => !existingTables.includes(table)
      );

      if (missingTables.length > 0) {
        console.log('🔧 RECOMMENDED ACTION: Complete Migration 001');
        console.log(
          '   Status: Some tables missing -',
          missingTables.join(', ')
        );
        console.log('   Next Step: Re-run 001_core_schema.sql completely');
      } else {
        console.log('✅ MIGRATION 001 COMPLETE');
        console.log('   Status: All core tables exist');
        console.log('   Next Step: Run 002_security_policies.sql');
        console.log('   File: database/migrations/002_security_policies.sql');
      }
    }

    console.log('\n🔗 HELPFUL LINKS:');
    console.log('   Database Setup Guide: database/README.md');
    console.log('   Migration Files: database/migrations/');
    console.log('   Quick Fix Guide: database/QUICK_FIX_GUIDE.md');
    console.log('   Supabase Dashboard: https://app.supabase.com/');
  } catch (error) {
    console.error('💥 Diagnostic failed:', error);
  }
};

// Run the diagnostic
runDatabaseDiagnostic();
