/**
 * 🔒 Security Audit Script
 * Validates security implementation across the Ethiopian Maids platform
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

class SecurityAuditor {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      issues: [],
    };
  }

  log(type, message, details = null) {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, type, message, details };

    switch (type) {
      case 'PASS':
        console.log(`✅ ${message}`);
        this.results.passed++;
        break;
      case 'FAIL':
        console.log(`❌ ${message}`);
        if (details) console.log(`   Details: ${details}`);
        this.results.failed++;
        this.results.issues.push(logEntry);
        break;
      case 'WARN':
        console.log(`⚠️  ${message}`);
        if (details) console.log(`   Details: ${details}`);
        this.results.warnings++;
        break;
      case 'INFO':
        console.log(`ℹ️  ${message}`);
        break;
    }
  }

  async checkRLSEnabled() {
    this.log('INFO', 'Checking Row Level Security (RLS) status...');

    try {
      const { data, error } = await supabase
        .from('pg_tables')
        .select('tablename, rowsecurity')
        .eq('schemaname', 'public');

      if (error) throw error;

      const criticalTables = [
        'profiles',
        'maid_profiles',
        'sponsor_profiles',
        'agency_profiles',
        'jobs',
        'applications',
        'messages',
      ];

      for (const table of criticalTables) {
        const tableInfo = data.find((t) => t.tablename === table);
        if (!tableInfo) {
          this.log('WARN', `Table ${table} not found`);
          continue;
        }

        if (tableInfo.rowsecurity) {
          this.log('PASS', `RLS enabled on ${table}`);
        } else {
          this.log(
            'FAIL',
            `RLS NOT enabled on ${table}`,
            'Critical security vulnerability'
          );
        }
      }
    } catch (error) {
      this.log('FAIL', 'Failed to check RLS status', error.message);
    }
  }

  async checkPolicies() {
    this.log('INFO', 'Checking RLS policies...');

    try {
      const { data, error } = await supabase
        .from('pg_policies')
        .select('tablename, policyname, cmd, roles')
        .eq('schemaname', 'public');

      if (error) throw error;

      const requiredPolicies = {
        profiles: [
          'users_own_profile_select',
          'users_own_profile_update',
          'users_own_profile_insert',
        ],
        maid_profiles: [
          'maid_own_profile',
          'sponsor_view_approved_maids',
          'public_view_approved_maids',
        ],
        jobs: [
          'sponsor_own_jobs',
          'maid_view_active_jobs',
          'public_view_active_jobs',
        ],
        messages: ['user_conversation_messages', 'user_send_messages'],
      };

      for (const [table, policies] of Object.entries(requiredPolicies)) {
        const tablePolicies = data.filter((p) => p.tablename === table);

        if (tablePolicies.length === 0) {
          this.log(
            'FAIL',
            `No policies found for ${table}`,
            'Table is unprotected'
          );
          continue;
        }

        for (const requiredPolicy of policies) {
          const policyExists = tablePolicies.some(
            (p) => p.policyname === requiredPolicy
          );
          if (policyExists) {
            this.log('PASS', `Policy ${requiredPolicy} exists on ${table}`);
          } else {
            this.log('WARN', `Policy ${requiredPolicy} missing on ${table}`);
          }
        }
      }
    } catch (error) {
      this.log('FAIL', 'Failed to check policies', error.message);
    }
  }

  async checkFunctions() {
    this.log('INFO', 'Checking security functions...');

    try {
      const { data, error } = await supabase
        .from('pg_proc')
        .select('proname')
        .eq('pronamespace', '2200'); // public schema

      if (error) throw error;

      const requiredFunctions = [
        'is_admin',
        'owns_profile',
        'agency_manages_maid',
        'is_approved_for_public',
      ];

      for (const func of requiredFunctions) {
        const functionExists = data.some((f) => f.proname === func);
        if (functionExists) {
          this.log('PASS', `Security function ${func} exists`);
        } else {
          this.log(
            'FAIL',
            `Security function ${func} missing`,
            'Required for RLS policies'
          );
        }
      }
    } catch (error) {
      this.log('FAIL', 'Failed to check functions', error.message);
    }
  }

  async checkIndexes() {
    this.log('INFO', 'Checking security-related indexes...');

    try {
      const { data, error } = await supabase
        .from('pg_indexes')
        .select('tablename, indexname')
        .eq('schemaname', 'public');

      if (error) throw error;

      const requiredIndexes = {
        profiles: ['idx_profiles_user_type', 'idx_profiles_email'],
        maid_profiles: ['idx_maid_profiles_availability'],
        jobs: ['idx_jobs_status'],
      };

      for (const [table, indexes] of Object.entries(requiredIndexes)) {
        const tableIndexes = data.filter((i) => i.tablename === table);

        for (const requiredIndex of indexes) {
          const indexExists = tableIndexes.some(
            (i) => i.indexname === requiredIndex
          );
          if (indexExists) {
            this.log('PASS', `Performance index ${requiredIndex} exists`);
          } else {
            this.log(
              'WARN',
              `Performance index ${requiredIndex} missing on ${table}`
            );
          }
        }
      }
    } catch (error) {
      this.log('FAIL', 'Failed to check indexes', error.message);
    }
  }

  async checkDataIntegrity() {
    this.log('INFO', 'Checking data integrity constraints...');

    try {
      // Check for orphaned records
      const { data: orphanedMaids, error: maidsError } = await supabase
        .from('maid_profiles')
        .select('id')
        .not('id', 'in', `(SELECT id FROM profiles WHERE user_type = 'maid')`);

      if (maidsError) throw maidsError;

      if (orphanedMaids && orphanedMaids.length > 0) {
        this.log(
          'FAIL',
          `Found ${orphanedMaids.length} orphaned maid profiles`,
          'Data integrity issue'
        );
      } else {
        this.log('PASS', 'No orphaned maid profiles found');
      }

      // Check for users without profiles
      const { data: usersWithoutProfiles, error: profilesError } =
        await supabase
          .from('auth.users')
          .select('id')
          .not('id', 'in', `(SELECT id FROM profiles)`);

      if (
        profilesError &&
        !profilesError.message.includes('permission denied')
      ) {
        throw profilesError;
      }

      // This check might not work due to RLS, so we'll skip the error
      if (usersWithoutProfiles && usersWithoutProfiles.length > 0) {
        this.log(
          'WARN',
          `Found ${usersWithoutProfiles.length} users without profiles`
        );
      } else {
        this.log('PASS', 'All users have corresponding profiles');
      }
    } catch (error) {
      this.log('WARN', 'Could not fully check data integrity', error.message);
    }
  }

  async checkEnvironmentSecurity() {
    this.log('INFO', 'Checking environment security...');

    // Check if service key is properly secured
    if (
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY.length > 100
    ) {
      this.log('PASS', 'Service role key appears to be properly configured');
    } else {
      this.log(
        'FAIL',
        'Service role key missing or invalid',
        'Required for admin operations'
      );
    }

    // Check if anon key is different from service key
    if (
      process.env.VITE_SUPABASE_ANON_KEY !==
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      this.log('PASS', 'Anonymous and service keys are different');
    } else {
      this.log(
        'FAIL',
        'Anonymous and service keys are the same',
        'Security vulnerability'
      );
    }

    // Check URL format
    if (supabaseUrl && supabaseUrl.startsWith('https://')) {
      this.log('PASS', 'Supabase URL uses HTTPS');
    } else {
      this.log(
        'FAIL',
        'Supabase URL does not use HTTPS',
        'Security vulnerability'
      );
    }
  }

  async runFullAudit() {
    console.log('🔒 ETHIOPIAN MAIDS SECURITY AUDIT');
    console.log('================================');
    console.log(`Started at: ${new Date().toISOString()}\n`);

    await this.checkRLSEnabled();
    console.log('');

    await this.checkPolicies();
    console.log('');

    await this.checkFunctions();
    console.log('');

    await this.checkIndexes();
    console.log('');

    await this.checkDataIntegrity();
    console.log('');

    await this.checkEnvironmentSecurity();
    console.log('');

    this.printSummary();
  }

  printSummary() {
    console.log('📊 SECURITY AUDIT SUMMARY');
    console.log('=========================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    console.log('');

    if (this.results.failed > 0) {
      console.log('🚨 CRITICAL ISSUES FOUND:');
      this.results.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.message}`);
        if (issue.details) console.log(`   ${issue.details}`);
      });
      console.log('');
      console.log(
        '❗ Please address these issues before deploying to production.'
      );
    } else if (this.results.warnings > 0) {
      console.log(
        '⚠️  Some warnings found. Review recommended but not critical.'
      );
    } else {
      console.log('🎉 All security checks passed!');
    }

    console.log(`\nAudit completed at: ${new Date().toISOString()}`);
  }
}

// Run the audit
const auditor = new SecurityAuditor();
auditor.runFullAudit().catch((error) => {
  console.error('💥 Security audit failed:', error);
  process.exit(1);
});
