#!/usr/bin/env node

/**
 * Production Readiness Check Script
 * Validates that the Ethiopian Maids platform is ready for production deployment
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
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) =>
    console.log(`\n${colors.cyan}🚀 ${msg}${colors.reset}\n${'='.repeat(50)}`),
  section: (msg) => console.log(`\n${colors.magenta}📋 ${msg}${colors.reset}`),
};

class ProductionChecker {
  constructor() {
    this.checks = [];
    this.errors = [];
    this.warnings = [];
    this.loadEnvironment();
  }

  loadEnvironment() {
    try {
      // Load .env file
      const envPath = path.join(__dirname, '../.env');
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const envVars = {};

        envContent.split('\n').forEach((line) => {
          const [key, ...valueParts] = line.split('=');
          if (key && !key.startsWith('#')) {
            envVars[key.trim()] = valueParts.join('=').trim();
          }
        });

        this.env = envVars;
      } else {
        this.env = process.env;
      }
    } catch (error) {
      log.error(`Failed to load environment: ${error.message}`);
      this.env = process.env;
    }
  }

  async checkEnvironmentConfiguration() {
    log.section('Environment Configuration');

    const requiredVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'TWILIO_ACCOUNT_SID',
      'TWILIO_AUTH_TOKEN',
      'TWILIO_PHONE_NUMBER',
    ];

    const optionalVars = [
      'VITE_STRIPE_PUBLISHABLE_KEY',
      'STRIPE_SECRET_KEY',
      'REACT_APP_NEWS_API_KEY',
    ];

    // Check NODE_ENV
    const nodeEnv = this.env.NODE_ENV || 'development';
    if (nodeEnv === 'production') {
      log.success('NODE_ENV is set to production');
    } else {
      log.warning(
        `NODE_ENV is set to '${nodeEnv}' - should be 'production' for deployment`
      );
    }

    // Check mock data setting
    const useMockData = this.env.VITE_USE_MOCK_DATA === 'true';
    if (!useMockData) {
      log.success('Mock data is disabled (VITE_USE_MOCK_DATA=false)');
    } else {
      log.error(
        'Mock data is enabled - must be disabled for production (VITE_USE_MOCK_DATA=false)'
      );
      this.errors.push('Mock data enabled in production');
    }

    // Check required variables
    let missingRequired = 0;
    requiredVars.forEach((varName) => {
      const value = this.env[varName];
      if (!value || value.includes('YOUR_') || value.includes('PLACEHOLDER')) {
        log.error(`Missing or invalid required variable: ${varName}`);
        this.errors.push(`Missing required environment variable: ${varName}`);
        missingRequired++;
      } else {
        log.success(`${varName} is configured`);
      }
    });

    // Check optional variables
    let missingOptional = 0;
    optionalVars.forEach((varName) => {
      const value = this.env[varName];
      if (!value || value.includes('YOUR_') || value.includes('PLACEHOLDER')) {
        log.warning(`Optional variable not configured: ${varName}`);
        this.warnings.push(
          `Optional environment variable not configured: ${varName}`
        );
        missingOptional++;
      } else {
        log.success(`${varName} is configured`);
      }
    });

    return {
      requiredConfigured: requiredVars.length - missingRequired,
      requiredTotal: requiredVars.length,
      optionalConfigured: optionalVars.length - missingOptional,
      optionalTotal: optionalVars.length,
      mockDataDisabled: !useMockData,
      productionEnv: nodeEnv === 'production',
    };
  }

  async checkDatabaseConnection() {
    log.section('Database Connection');

    try {
      const supabaseUrl = this.env.VITE_SUPABASE_URL;
      const supabaseKey = this.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        log.error('Supabase credentials not configured');
        this.errors.push('Supabase credentials missing');
        return { connected: false, tablesExist: false };
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Test basic connection
      log.info('Testing database connection...');
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error && error.code !== 'PGRST116') {
        log.error(`Database connection failed: ${error.message}`);
        this.errors.push(`Database connection error: ${error.message}`);
        return { connected: false, tablesExist: false };
      }

      log.success('Database connection successful');

      // Check core tables
      const coreTables = [
        'profiles',
        'maid_profiles',
        'job_postings',
        'conversations',
      ];
      const tableResults = await Promise.allSettled(
        coreTables.map(async (table) => {
          const { error } = await supabase.from(table).select('*').limit(1);
          return { table, exists: !error || error.code === 'PGRST116' };
        })
      );

      const existingTables = tableResults
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value)
        .filter((result) => result.exists);

      existingTables.forEach(({ table }) => {
        log.success(`Table '${table}' exists`);
      });

      const missingTables = coreTables.filter(
        (table) => !existingTables.find((existing) => existing.table === table)
      );

      missingTables.forEach((table) => {
        log.error(`Table '${table}' is missing`);
        this.errors.push(`Missing database table: ${table}`);
      });

      return {
        connected: true,
        tablesExist: missingTables.length === 0,
        existingTables: existingTables.length,
        totalTables: coreTables.length,
      };
    } catch (error) {
      log.error(`Database check failed: ${error.message}`);
      this.errors.push(`Database check error: ${error.message}`);
      return { connected: false, tablesExist: false };
    }
  }

  async checkFileStructure() {
    log.section('File Structure');

    const requiredFiles = [
      'src/App.jsx',
      'src/contexts/AuthContext.jsx',
      'src/services/databaseService.js',
      'src/services/productionConfigService.js',
      'src/services/errorHandlingService.js',
      'package.json',
      'vite.config.js',
    ];

    const requiredDirs = [
      'src/components',
      'src/pages',
      'src/services',
      'src/contexts',
      'database/migrations',
    ];

    let missingFiles = 0;
    let missingDirs = 0;

    requiredFiles.forEach((file) => {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        log.success(`File exists: ${file}`);
      } else {
        log.error(`Missing file: ${file}`);
        this.errors.push(`Missing required file: ${file}`);
        missingFiles++;
      }
    });

    requiredDirs.forEach((dir) => {
      const dirPath = path.join(__dirname, '..', dir);
      if (fs.existsSync(dirPath)) {
        log.success(`Directory exists: ${dir}`);
      } else {
        log.error(`Missing directory: ${dir}`);
        this.errors.push(`Missing required directory: ${dir}`);
        missingDirs++;
      }
    });

    return {
      filesExist: requiredFiles.length - missingFiles,
      totalFiles: requiredFiles.length,
      dirsExist: requiredDirs.length - missingDirs,
      totalDirs: requiredDirs.length,
    };
  }

  async checkPackageDependencies() {
    log.section('Package Dependencies');

    try {
      const packagePath = path.join(__dirname, '..', 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      const requiredDeps = [
        '@supabase/supabase-js',
        'react',
        'react-dom',
        'react-router-dom',
        '@stripe/stripe-js',
        'framer-motion',
      ];

      let missingDeps = 0;
      requiredDeps.forEach((dep) => {
        if (
          packageJson.dependencies?.[dep] ||
          packageJson.devDependencies?.[dep]
        ) {
          log.success(`Dependency installed: ${dep}`);
        } else {
          log.error(`Missing dependency: ${dep}`);
          this.errors.push(`Missing required dependency: ${dep}`);
          missingDeps++;
        }
      });

      return {
        depsInstalled: requiredDeps.length - missingDeps,
        totalDeps: requiredDeps.length,
        packageJsonValid: true,
      };
    } catch (error) {
      log.error(`Package.json check failed: ${error.message}`);
      this.errors.push(`Package.json error: ${error.message}`);
      return {
        depsInstalled: 0,
        totalDeps: 0,
        packageJsonValid: false,
      };
    }
  }

  generateReport() {
    log.header('PRODUCTION READINESS REPORT');

    const totalErrors = this.errors.length;
    const totalWarnings = this.warnings.length;

    console.log(`📊 Summary:`);
    console.log(`   Errors: ${totalErrors}`);
    console.log(`   Warnings: ${totalWarnings}`);
    console.log(
      `   Status: ${totalErrors === 0 ? '✅ READY' : '❌ NOT READY'}`
    );

    if (totalErrors > 0) {
      log.section('❌ ERRORS (Must Fix)');
      this.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    if (totalWarnings > 0) {
      log.section('⚠️  WARNINGS (Recommended)');
      this.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }

    if (totalErrors === 0) {
      log.success('\n🎉 Platform is ready for production deployment!');
    } else {
      log.error(
        `\n🚫 Platform is NOT ready for production. Fix ${totalErrors} error(s) first.`
      );
    }

    return {
      ready: totalErrors === 0,
      errors: totalErrors,
      warnings: totalWarnings,
    };
  }

  async run() {
    log.header('ETHIOPIAN MAIDS - PRODUCTION READINESS CHECK');

    try {
      const [envCheck, dbCheck, fileCheck, depCheck] = await Promise.all([
        this.checkEnvironmentConfiguration(),
        this.checkDatabaseConnection(),
        this.checkFileStructure(),
        this.checkPackageDependencies(),
      ]);

      const report = this.generateReport();

      // Exit with appropriate code
      process.exit(report.ready ? 0 : 1);
    } catch (error) {
      log.error(`Production check failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// Run the check
const checker = new ProductionChecker();
checker.run();
