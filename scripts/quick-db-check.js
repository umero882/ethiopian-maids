#!/usr/bin/env node

/**
 * Quick Database Health Check
 * Verifies all tables exist after running fix script
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables (try .env.local first, then .env)
dotenv.config({ path: join(__dirname, '..', '.env.local') });
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`❌ ${tableName.padEnd(20)} - ERROR: ${error.message}`);
      return false;
    }
    console.log(`✓ ${tableName.padEnd(20)} - EXISTS`);
    return true;
  } catch (err) {
    console.log(`❌ ${tableName.padEnd(20)} - ERROR: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('\n🔍 Quick Database Check\n');

  const tables = [
    'countries',
    'skills',
    'profiles',
    'maid_profiles',
    'sponsor_profiles',
    'agency_profiles',
    'conversations',
    'bookings',
    'subscriptions',
    'payments',
    'support_tickets',
    'admin_users',
    'audit_logs'
  ];

  console.log('Checking tables...\n');

  let allGood = true;
  for (const table of tables) {
    const exists = await checkTable(table);
    if (!exists) allGood = false;
  }

  console.log('\n' + '='.repeat(50));

  if (allGood) {
    console.log('✅ All tables exist and are accessible!');
  } else {
    console.log('⚠️  Some tables are missing or inaccessible');
    console.log('Run the fix-missing-tables.sql script in Supabase');
  }

  console.log('='.repeat(50) + '\n');
}

main().catch(console.error);
