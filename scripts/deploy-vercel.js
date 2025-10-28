#!/usr/bin/env node

/**
 * Vercel Deployment Script for Ethiopian Maids Platform
 *
 * This script handles the deployment process to Vercel with proper
 * environment variable setup and production optimizations.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  header: (msg) =>
    console.log(`\n${colors.cyan}${colors.bright}🚀 ${msg}${colors.reset}\n`),
};

class VercelDeployer {
  constructor() {
    this.projectName = 'ethio-maids';
    this.requiredEnvVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_STRIPE_PUBLISHABLE_KEY',
    ];
  }

  /**
   * Check if Vercel CLI is installed
   */
  checkVercelCLI() {
    log.info('Checking Vercel CLI installation...');
    try {
      execSync('vercel --version', { stdio: 'pipe' });
      log.success('Vercel CLI is installed');
      return true;
    } catch (error) {
      log.error('Vercel CLI is not installed');
      log.info('Install it with: npm i -g vercel');
      return false;
    }
  }

  /**
   * Check if user is logged in to Vercel
   */
  checkVercelAuth() {
    log.info('Checking Vercel authentication...');
    try {
      execSync('vercel whoami', { stdio: 'pipe' });
      log.success('Logged in to Vercel');
      return true;
    } catch (error) {
      log.error('Not logged in to Vercel');
      log.info('Login with: vercel login');
      return false;
    }
  }

  /**
   * Check if required environment variables are set
   */
  checkEnvironmentVariables() {
    log.info('Checking environment variables...');
    const envPath = path.join(rootDir, '.env.local');

    if (!fs.existsSync(envPath)) {
      log.warning('.env.local file not found');
      log.info(
        'Copy .env.local.template to .env.local and fill in your values'
      );
      return false;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const missingVars = [];

    for (const varName of this.requiredEnvVars) {
      if (
        !envContent.includes(`${varName}=`) ||
        envContent.includes(`${varName}=your_`)
      ) {
        missingVars.push(varName);
      }
    }

    if (missingVars.length > 0) {
      log.error(
        `Missing or incomplete environment variables: ${missingVars.join(', ')}`
      );
      return false;
    }

    log.success('Environment variables are configured');
    return true;
  }

  /**
   * Run production build
   */
  runBuild() {
    log.info('Running production build...');
    try {
      execSync('npm run build', {
        stdio: 'inherit',
        cwd: rootDir,
      });
      log.success('Build completed successfully');
      return true;
    } catch (error) {
      log.error('Build failed');
      return false;
    }
  }

  /**
   * Deploy to Vercel
   */
  async deploy(production = false) {
    log.info(
      `Deploying to Vercel ${production ? '(production)' : '(preview)'}...`
    );

    const deployCommand = production ? 'vercel --prod' : 'vercel';

    try {
      const output = execSync(deployCommand, {
        stdio: 'pipe',
        cwd: rootDir,
        encoding: 'utf8',
      });

      // Extract deployment URL from output
      const urlMatch = output.match(/https:\/\/[^\s]+/);
      const deploymentUrl = urlMatch ? urlMatch[0] : 'Deployment URL not found';

      log.success(`Deployment successful!`);
      log.info(`Deployment URL: ${deploymentUrl}`);

      return deploymentUrl;
    } catch (error) {
      log.error('Deployment failed');
      console.error(error.message);
      return null;
    }
  }

  /**
   * Set environment variables in Vercel
   */
  setEnvironmentVariables() {
    log.info('Setting environment variables in Vercel...');

    const envPath = path.join(rootDir, '.env.local');
    if (!fs.existsSync(envPath)) {
      log.error('.env.local file not found');
      return false;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent
      .split('\n')
      .filter(
        (line) =>
          line.trim() &&
          !line.startsWith('#') &&
          line.includes('=') &&
          line.startsWith('VITE_')
      );

    for (const line of envLines) {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=');

      if (key && value && !value.includes('your_')) {
        try {
          execSync(`vercel env add ${key} production`, {
            input: value,
            stdio: ['pipe', 'pipe', 'inherit'],
            cwd: rootDir,
          });
          log.success(`Set ${key}`);
        } catch (error) {
          log.warning(`Failed to set ${key} (may already exist)`);
        }
      }
    }

    return true;
  }

  /**
   * Main deployment process
   */
  async run(options = {}) {
    log.header('Ethiopian Maids - Vercel Deployment');

    const { production = false, skipBuild = false, setEnv = false } = options;

    // Pre-deployment checks
    if (!this.checkVercelCLI()) return false;
    if (!this.checkVercelAuth()) return false;
    if (!this.checkEnvironmentVariables()) return false;

    // Set environment variables if requested
    if (setEnv) {
      this.setEnvironmentVariables();
    }

    // Build the project
    if (!skipBuild) {
      if (!this.runBuild()) return false;
    }

    // Deploy to Vercel
    const deploymentUrl = await this.deploy(production);

    if (deploymentUrl) {
      log.header('Deployment Complete! 🎉');
      log.info(
        `Your Ethiopian Maids platform is now live at: ${deploymentUrl}`
      );

      if (!production) {
        log.info(
          'This is a preview deployment. Use --prod flag for production deployment.'
        );
      }

      return true;
    }

    return false;
  }
}

// CLI interface
const args = process.argv.slice(2);
const options = {
  production: args.includes('--prod') || args.includes('--production'),
  skipBuild: args.includes('--skip-build'),
  setEnv: args.includes('--set-env'),
  help: args.includes('--help') || args.includes('-h'),
};

if (options.help) {
  console.log(`
Ethiopian Maids - Vercel Deployment Script

Usage: node scripts/deploy-vercel.js [options]

Options:
  --prod, --production    Deploy to production
  --skip-build           Skip the build step
  --set-env              Set environment variables in Vercel
  --help, -h             Show this help message

Examples:
  node scripts/deploy-vercel.js                    # Preview deployment
  node scripts/deploy-vercel.js --prod             # Production deployment
  node scripts/deploy-vercel.js --set-env --prod   # Set env vars and deploy to production
  `);
  process.exit(0);
}

// Run the deployment
const deployer = new VercelDeployer();
deployer
  .run(options)
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    log.error(`Deployment failed: ${error.message}`);
    process.exit(1);
  });
