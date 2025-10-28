#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Validates environment variables before build/deploy
 * Ensures no secrets are exposed with VITE_ prefix
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Required frontend environment variables (must have VITE_ prefix)
const requiredFrontendVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_STRIPE_PUBLISHABLE_KEY',
];

// Optional frontend variables
const optionalFrontendVars = [
  'VITE_APP_NAME',
  'VITE_APP_VERSION',
  'VITE_APP_ENVIRONMENT',
  'VITE_ELEVENLABS_AGENT_ID',
  'VITE_TWILIO_ACCOUNT_SID',
  'VITE_TWILIO_PHONE_NUMBER',
  'VITE_ENABLE_CHAT',
  'VITE_ENABLE_VIDEO_CALLS',
  'VITE_ENABLE_ANALYTICS',
];

// Variables that should NEVER have VITE_ prefix (backend secrets)
const forbiddenViteVars = [
  'VITE_SUPABASE_SERVICE_KEY',
  'VITE_SUPABASE_ACCESS_TOKEN',
  'VITE_STRIPE_SECRET_KEY',
  'VITE_STRIPE_WEBHOOK_SECRET',
  'VITE_TWILIO_AUTH_TOKEN',
  'VITE_TWILIO_API_KEY_SECRET',
  'VITE_ELEVENLABS_API_KEY',
  'VITE_SENDGRID_API_KEY',
  'VITE_EMAIL_PASSWORD',
  'VITE_AWS_SECRET_ACCESS_KEY',
];

// Patterns that indicate secret values
const secretPatterns = [
  /sk_live_/i, // Stripe live secret key
  /sk_test_.*[0-9a-f]{20}/i, // Stripe test secret key (long)
  /whsec_/i, // Stripe webhook secret
  /SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}/i, // SendGrid API key
  /sk_[0-9a-f]{48}/i, // ElevenLabs API key
  /eyJ[A-Za-z0-9_-]{100,}/i, // JWT tokens (long)
];

class EnvValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  error(message) {
    this.errors.push(message);
    this.log(`❌ ERROR: ${message}`, 'red');
  }

  warn(message) {
    this.warnings.push(message);
    this.log(`⚠️  WARNING: ${message}`, 'yellow');
  }

  success(message) {
    this.log(`✅ ${message}`, 'green');
  }

  infoLog(message) {
    this.info.push(message);
    this.log(`ℹ️  ${message}`, 'cyan');
  }

  /**
   * Load environment variables from .env file
   */
  loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) {
      return {};
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const env = {};

    content.split('\n').forEach((line) => {
      line = line.trim();
      if (!line || line.startsWith('#')) return;

      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (match) {
        env[match[1]] = match[2];
      }
    });

    return env;
  }

  /**
   * Check for forbidden VITE_ prefixed secrets
   */
  checkForbiddenViteVars(env) {
    this.log('\n📋 Checking for forbidden VITE_ prefixed secrets...', 'blue');

    let found = false;
    forbiddenViteVars.forEach((varName) => {
      if (env[varName]) {
        this.error(
          `Secret "${varName}" has VITE_ prefix! This will expose it in the browser bundle.`
        );
        found = true;
      }
    });

    if (!found) {
      this.success('No forbidden VITE_ prefixed secrets found');
    }
  }

  /**
   * Check for secret patterns in VITE_ variables
   */
  checkSecretPatterns(env) {
    this.log('\n🔍 Scanning VITE_ variables for secret patterns...', 'blue');

    // Variables that are exempt from secret pattern checks (they're meant to be public)
    const exemptVars = [
      'VITE_SUPABASE_ANON_KEY', // Supabase anon key is designed to be public
      'VITE_STRIPE_PUBLISHABLE_KEY', // Stripe publishable key is public
    ];

    let found = false;
    Object.entries(env).forEach(([key, value]) => {
      if (!key.startsWith('VITE_')) return;
      if (!value) return;
      if (exemptVars.includes(key)) return; // Skip exempt variables

      secretPatterns.forEach((pattern) => {
        if (pattern.test(value)) {
          this.error(
            `Variable "${key}" appears to contain a secret value (matches pattern: ${pattern})`
          );
          found = true;
        }
      });
    });

    if (!found) {
      this.success('No secret patterns found in VITE_ variables');
    }
  }

  /**
   * Check required frontend variables
   */
  checkRequiredVars(env) {
    this.log('\n📝 Checking required frontend variables...', 'blue');

    const isProduction = process.env.NODE_ENV === 'production';
    let allPresent = true;

    requiredFrontendVars.forEach((varName) => {
      if (!env[varName] || env[varName] === '') {
        if (isProduction) {
          this.error(`Required variable "${varName}" is missing`);
          allPresent = false;
        } else {
          this.warn(`Required variable "${varName}" is missing (OK in development)`);
        }
      } else {
        this.infoLog(`${varName}: present`);
      }
    });

    if (allPresent) {
      this.success('All required variables are present');
    }
  }

  /**
   * Check for test keys in production
   */
  checkProductionKeys(env) {
    if (process.env.NODE_ENV !== 'production') {
      this.infoLog('Skipping production key check (not in production mode)');
      return;
    }

    this.log('\n🚀 Checking for test keys in production...', 'blue');

    let found = false;
    Object.entries(env).forEach(([key, value]) => {
      if (!value) return;

      if (value.includes('_test_') || value.includes('pk_test')) {
        this.error(
          `Variable "${key}" contains test credentials in production mode!`
        );
        found = true;
      }
    });

    if (!found) {
      this.success('No test credentials found in production mode');
    }
  }

  /**
   * Generate security report
   */
  generateReport() {
    this.log('\n' + '='.repeat(60), 'magenta');
    this.log('ENVIRONMENT VALIDATION REPORT', 'magenta');
    this.log('='.repeat(60), 'magenta');

    if (this.errors.length === 0 && this.warnings.length === 0) {
      this.log('\n✅ VALIDATION PASSED', 'green');
      this.log('All environment variables are properly configured.', 'green');
    } else {
      if (this.errors.length > 0) {
        this.log(`\n❌ ERRORS: ${this.errors.length}`, 'red');
        this.errors.forEach((err, i) => {
          this.log(`  ${i + 1}. ${err}`, 'red');
        });
      }

      if (this.warnings.length > 0) {
        this.log(`\n⚠️  WARNINGS: ${this.warnings.length}`, 'yellow');
        this.warnings.forEach((warn, i) => {
          this.log(`  ${i + 1}. ${warn}`, 'yellow');
        });
      }
    }

    this.log('\n' + '='.repeat(60), 'magenta');

    return this.errors.length === 0;
  }

  /**
   * Run all validations
   */
  validate() {
    this.log('🔐 Environment Variable Security Validation', 'cyan');
    this.log('='.repeat(60), 'cyan');

    // Load .env file
    const envPath = path.join(process.cwd(), '.env');
    const env = this.loadEnvFile(envPath);

    if (Object.keys(env).length === 0) {
      this.warn('No .env file found or file is empty');
      this.infoLog('This is OK if using platform environment variables (Vercel, etc.)');
    } else {
      this.infoLog(`Loaded ${Object.keys(env).length} variables from .env`);
    }

    // Run checks
    this.checkForbiddenViteVars(env);
    this.checkSecretPatterns(env);
    this.checkRequiredVars(env);
    this.checkProductionKeys(env);

    // Generate report
    return this.generateReport();
  }
}

// Run validation
const validator = new EnvValidator();
const passed = validator.validate();

// Exit with appropriate code
if (!passed) {
  console.log('\n❌ Environment validation failed!');
  console.log('Please fix the errors above before deploying.\n');
  process.exit(1);
} else {
  console.log('\n✅ Environment validation passed!\n');
  process.exit(0);
}
