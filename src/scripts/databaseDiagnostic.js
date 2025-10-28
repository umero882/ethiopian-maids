/**
 * Database Diagnostic Script
 * Checks current database state and provides migration guidance
 */

import { supabase } from '../lib/supabaseClient.js';

const runDatabaseDiagnostic = async () => {
  console.log('🔍 Database Diagnostic Report\n');
  console.log('=====================================\n');

  try {
    // Test 1: Check Supabase connection
    console.log('1️⃣ Testing Supabase Connection...');
    const {
      data: { session: _session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('❌ Connection failed:', sessionError.message);
      return;
    }
    console.log('✅ Supabase connected successfully\n');

    // Test 2: Check which tables exist
    console.log('2️⃣ Checking existing tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .order('table_name');

    if (tablesError) {
      console.error('❌ Cannot query tables:', tablesError.message);
      console.log('   This usually means no migrations have been run yet.\n');
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
    console.log('3️⃣ Checking table structure...');
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
              `⚠️  Table '${tableName}' exists but has RLS enabled (expected)`
            );
          } else {
            console.log(`❌ Error accessing '${tableName}':`, error.message);
          }
        } else {
          console.log(`✅ Table '${tableName}' accessible`);
        }
      } catch (err) {
        console.log(`❌ Error checking '${tableName}':`, err.message);
      }
    }

    // Test 4: Check for sample data
    console.log('\n4️⃣ Checking sample data...');
    try {
      const { data: countries, error: countriesError } = await supabase
        .from('countries')
        .select('count(*)')
        .single();

      if (countriesError) {
        console.log(
          '❌ Cannot access countries table:',
          countriesError.message
        );
      } else {
        console.log(`✅ Countries table has ${countries.count} records`);
      }
    } catch (err) {
      console.log('❌ Error checking countries data:', err.message);
    }

    try {
      const { data: skills, error: skillsError } = await supabase
        .from('skills')
        .select('count(*)')
        .single();

      if (skillsError) {
        console.log('❌ Cannot access skills table:', skillsError.message);
      } else {
        console.log(`✅ Skills table has ${skills.count} records`);
      }
    } catch (err) {
      console.log('❌ Error checking skills data:', err.message);
    }

    // Provide recommendations
    console.log('\n📋 DIAGNOSTIC SUMMARY');
    console.log('=====================================');

    if (tablesError || !tables || tables.length === 0) {
      console.log('🔧 RECOMMENDED ACTION: Run Migration 001');
      console.log('   Status: No tables found - database is empty');
      console.log(
        '   Next Step: Run 001_core_schema.sql in Supabase SQL Editor'
      );
      console.log('   File: database/migrations/001_core_schema.sql');
    } else {
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
    console.log('   Supabase Dashboard: https://app.supabase.com/');
  } catch (error) {
    console.error('💥 Diagnostic failed:', error);
  }
};

// Auto-run if this script is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.runDatabaseDiagnostic = runDatabaseDiagnostic;
  console.log(
    '🔧 Database diagnostic loaded. Run runDatabaseDiagnostic() in console.'
  );
} else {
  // Node environment
  runDatabaseDiagnostic();
}

export default runDatabaseDiagnostic;
