#!/usr/bin/env node

/**
 * List Database Tables
 * Shows what tables exist in the production database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) =>
    console.log(`\n${colors.cyan}🚀 ${msg}${colors.reset}\n${'='.repeat(50)}`),
};

// Load environment variables from .env file
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '../.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split('=');
      if (key && !key.startsWith('#') && key.trim()) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });

    return envVars;
  } catch (error) {
    log.error(`Failed to load .env file: ${error.message}`);
    return {};
  }
}

async function listTables() {
  log.header('LISTING DATABASE TABLES');

  const env = loadEnvFile();
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_KEY || env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log.error('Supabase credentials not found');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // List of tables we expect to exist
  const expectedTables = [
    'profiles',
    'maid_profiles',
    'sponsor_profiles',
    'agency_profiles',
    'job_postings',
    'conversations',
    'messages',
    'user_subscriptions',
    'support_tickets',
    'error_logs',
  ];

  log.info('Checking for expected tables...');

  for (const tableName of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST106') {
          log.error(`❌ Table '${tableName}' does not exist`);
        } else {
          log.warning(
            `⚠️  Table '${tableName}' exists but has access issues: ${error.message}`
          );
        }
      } else {
        log.success(`✅ Table '${tableName}' exists and is accessible`);

        // If we got data, show the structure
        if (data && data.length > 0) {
          const columns = Object.keys(data[0]);
          log.info(`   Columns: ${columns.join(', ')}`);
        } else {
          // Try to get column info by attempting an insert with empty data
          try {
            const { error: insertError } = await supabase
              .from(tableName)
              .insert({});

            if (insertError && insertError.message.includes('null value')) {
              // Extract column names from error message
              const matches = insertError.message.match(/column "([^"]+)"/g);
              if (matches) {
                const requiredColumns = matches.map((match) =>
                  match.replace(/column "|"/g, '')
                );
                log.info(`   Required columns: ${requiredColumns.join(', ')}`);
              }
            }
          } catch (e) {
            // Ignore insert errors, we just wanted column info
          }
        }
      }
    } catch (error) {
      log.error(`❌ Error checking table '${tableName}': ${error.message}`);
    }
  }

  // Try to create a minimal profiles table if it doesn't exist
  log.header('ATTEMPTING TO CREATE MISSING TABLES');

  try {
    // Check if we can create the profiles table
    log.info('Attempting to create profiles table...');

    const createProfilesSQL = `
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        name TEXT,
        role TEXT NOT NULL DEFAULT 'sponsor',
        phone TEXT,
        country TEXT,
        registration_complete BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Enable RLS
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
      
      -- Create policies
      CREATE POLICY "Users can view own profile" ON profiles
        FOR SELECT USING (auth.uid() = id);
      
      CREATE POLICY "Users can insert own profile" ON profiles
        FOR INSERT WITH CHECK (auth.uid() = id);
      
      CREATE POLICY "Users can update own profile" ON profiles
        FOR UPDATE USING (auth.uid() = id);
    `;

    // Note: We can't execute raw SQL through the client without proper permissions
    // This would need to be done through the Supabase dashboard or with service role
    log.warning(
      '⚠️  Cannot create tables through client - needs to be done in Supabase dashboard'
    );
  } catch (error) {
    log.error(`Failed to create tables: ${error.message}`);
  }
}

async function main() {
  await listTables();

  log.header('TABLE ANALYSIS COMPLETE');
  console.log('\n📋 SUMMARY:');
  console.log('   • Check which tables exist in your Supabase database');
  console.log(
    '   • If profiles table is missing, create it in Supabase dashboard'
  );
  console.log('   • Ensure the role column exists and is properly configured');
  console.log('   • Verify RLS policies allow user registration');
}

main();
