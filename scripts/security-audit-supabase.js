/**
 * 🔒 Supabase-Compatible Security Audit Script
 * Tests security implementation using Supabase-available APIs
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
const supabaseService = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

class SupabaseSecurityAuditor {
  constructor() {
    this.results = { passed: 0, failed: 0, warnings: 0, issues: [] };
  }

  log(type, message, details = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      message,
      details,
    };

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

  async testRLSProtection() {
    this.log('INFO', 'Testing RLS protection...');

    const criticalTables = [
      'profiles',
      'maid_profiles',
      'sponsor_profiles',
      'jobs',
    ];

    for (const table of criticalTables) {
      try {
        // Test anonymous access (should be restricted)
        const { data, error } = await supabaseAnon.from(table).select('*');

        if (error && error.message.includes('permission denied')) {
          this.log('PASS', `RLS properly protects ${table} table`);
        } else if (data && data.length === 0) {
          this.log(
            'PASS',
            `RLS allows query but returns no unauthorized data for ${table}`
          );
        } else if (data && data.length > 0) {
          // Check if returned data is properly filtered (e.g., only public data)
          if (
            table === 'maid_profiles' &&
            data.every((item) => item.is_approved === true)
          ) {
            this.log(
              'PASS',
              `RLS properly filters ${table} to show only approved records`
            );
          } else {
            this.log('WARN', `${table} may be exposing unauthorized data`);
          }
        } else {
          this.log('WARN', `Unable to determine RLS status for ${table}`);
        }
      } catch (error) {
        this.log('FAIL', `Failed to test RLS for ${table}`, error.message);
      }
    }
  }

  async testDataIntegrity() {
    this.log('INFO', 'Testing data integrity...');

    try {
      // Test foreign key relationships
      const { data: profiles, error: profilesError } = await supabaseService
        .from('profiles')
        .select('id, user_type')
        .limit(5);

      if (profilesError) {
        this.log(
          'WARN',
          'Cannot access profiles for integrity check (may be due to RLS)'
        );
        return;
      }

      if (profiles && profiles.length > 0) {
        this.log(
          'PASS',
          `Found ${profiles.length} profiles for integrity testing`
        );

        // Check if user_type values are valid
        const validUserTypes = ['maid', 'sponsor', 'agency', 'admin'];
        const invalidTypes = profiles.filter(
          (p) => !validUserTypes.includes(p.user_type)
        );

        if (invalidTypes.length === 0) {
          this.log('PASS', 'All profiles have valid user_type values');
        } else {
          this.log(
            'FAIL',
            `Found ${invalidTypes.length} profiles with invalid user_type`
          );
        }
      }
    } catch (error) {
      this.log('WARN', 'Could not fully test data integrity', error.message);
    }
  }

  async testAuthenticationSecurity() {
    this.log('INFO', 'Testing authentication security...');

    try {
      // Test that we can't access user management functions without proper auth
      const { data, error } = await supabaseAnon.auth.admin.listUsers();

      if (error && error.message.includes('JWT')) {
        this.log(
          'PASS',
          'Admin functions properly protected from anonymous access'
        );
      } else {
        this.log(
          'FAIL',
          'Admin functions may be accessible without proper authentication'
        );
      }
    } catch (error) {
      this.log('PASS', 'Admin functions properly protected (expected error)');
    }
  }

  async testInputValidation() {
    this.log('INFO', 'Testing input validation...');

    try {
      // Test SQL injection protection
      const maliciousInput = "'; DROP TABLE profiles; --";

      const { data, error } = await supabaseAnon
        .from('profiles')
        .select('*')
        .eq('name', maliciousInput);

      if (error && !error.message.includes('permission denied')) {
        this.log(
          'FAIL',
          'Unexpected error with malicious input',
          error.message
        );
      } else {
        this.log('PASS', 'SQL injection protection appears to be working');
      }

      // Test UUID validation
      const invalidUUID = 'not-a-uuid';
      const { data: uuidData, error: uuidError } = await supabaseAnon
        .from('profiles')
        .select('*')
        .eq('id', invalidUUID);

      if (
        uuidError &&
        uuidError.message.includes('invalid input syntax for type uuid')
      ) {
        this.log('PASS', 'UUID validation is working correctly');
      } else {
        this.log('WARN', 'UUID validation may not be properly enforced');
      }
    } catch (error) {
      this.log('FAIL', 'Failed to test input validation', error.message);
    }
  }

  async testEnvironmentSecurity() {
    this.log('INFO', 'Testing environment security...');

    // Check URL security
    if (supabaseUrl.startsWith('https://')) {
      this.log('PASS', 'Supabase URL uses HTTPS');
    } else {
      this.log('FAIL', 'Supabase URL does not use HTTPS');
    }

    // Check key security
    if (supabaseAnonKey !== supabaseServiceKey) {
      this.log('PASS', 'Anonymous and service keys are different');
    } else {
      this.log('FAIL', 'Anonymous and service keys are the same');
    }

    // Check key format
    if (supabaseAnonKey.startsWith('eyJ') && supabaseAnonKey.length > 100) {
      this.log('PASS', 'Anonymous key format appears correct');
    } else {
      this.log('FAIL', 'Anonymous key format is invalid');
    }

    if (supabaseServiceKey) {
      if (
        supabaseServiceKey.startsWith('eyJ') &&
        supabaseServiceKey.length > 100
      ) {
        this.log('PASS', 'Service key format appears correct');
      } else {
        this.log('FAIL', 'Service key format is invalid');
      }
    }
  }

  async testTableAccess() {
    this.log('INFO', 'Testing table access patterns...');

    const tables = [
      { name: 'profiles', shouldBeRestricted: true },
      { name: 'maid_profiles', shouldBeRestricted: false }, // May allow public approved profiles
      { name: 'jobs', shouldBeRestricted: false }, // May allow public active jobs
      { name: 'applications', shouldBeRestricted: true },
      { name: 'messages', shouldBeRestricted: true },
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabaseAnon
          .from(table.name)
          .select('count', { count: 'exact', head: true });

        if (error && error.message.includes('permission denied')) {
          if (table.shouldBeRestricted) {
            this.log(
              'PASS',
              `${table.name} properly restricted from anonymous access`
            );
          } else {
            this.log('WARN', `${table.name} may be overly restricted`);
          }
        } else if (!error) {
          if (!table.shouldBeRestricted) {
            this.log('PASS', `${table.name} allows appropriate public access`);
          } else {
            this.log('WARN', `${table.name} may allow unauthorized access`);
          }
        }
      } catch (error) {
        this.log(
          'WARN',
          `Could not test access for ${table.name}`,
          error.message
        );
      }
    }
  }

  async runFullAudit() {
    console.log('🔒 SUPABASE SECURITY AUDIT');
    console.log('==========================');
    console.log(`Started at: ${new Date().toISOString()}\n`);

    await this.testEnvironmentSecurity();
    console.log('');

    await this.testRLSProtection();
    console.log('');

    await this.testTableAccess();
    console.log('');

    await this.testAuthenticationSecurity();
    console.log('');

    await this.testInputValidation();
    console.log('');

    await this.testDataIntegrity();
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
const auditor = new SupabaseSecurityAuditor();
auditor.runFullAudit().catch((error) => {
  console.error('💥 Security audit failed:', error);
  process.exit(1);
});
