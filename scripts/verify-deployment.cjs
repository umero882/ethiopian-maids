#!/usr/bin/env node

/**
 * Deployment Verification Script
 * ================================
 * Verifies that all required secrets and configurations are properly set up
 * for deployment to Vercel via GitHub Actions.
 *
 * Usage:
 *   node scripts/verify-deployment.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function section(title) {
  log(`\n${'='.repeat(80)}`, colors.blue);
  log(`  ${title}`, colors.blue);
  log(`${'='.repeat(80)}`, colors.blue);
}

function checkMark(passed) {
  return passed ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`;
}

// Required environment variables for production
const REQUIRED_ENV_VARS = {
  'Vercel': [
    'VERCEL_TOKEN',
    'VERCEL_ORG_ID',
    'VERCEL_PROJECT_ID',
  ],
  'Supabase': [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ],
  'Stripe': [
    'VITE_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
  ],
  'Twilio': [
    'VITE_TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'VITE_TWILIO_PHONE_NUMBER',
  ],
};

// Check if .env.local exists
function checkEnvFile() {
  section('Environment File Check');

  const envPath = path.join(process.cwd(), '.env.local');
  const exists = fs.existsSync(envPath);

  log(`${checkMark(exists)} .env.local file`);

  if (!exists) {
    log('  ⚠️  Create .env.local from .env.example', colors.yellow);
    return false;
  }

  return true;
}

// Load and parse .env.local
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  const content = fs.readFileSync(envPath, 'utf8');

  const env = {};
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });

  return env;
}

// Check required environment variables
function checkRequiredVars(env) {
  section('Required Environment Variables');

  let allPresent = true;

  for (const [service, vars] of Object.entries(REQUIRED_ENV_VARS)) {
    log(`\n${service}:`, colors.magenta);

    for (const varName of vars) {
      const present = env[varName] && env[varName].length > 0;
      log(`  ${checkMark(present)} ${varName}`);

      if (!present) {
        allPresent = false;
        log(`    ⚠️  Missing or empty`, colors.yellow);
      }
    }
  }

  return allPresent;
}

// Check GitHub repository
async function checkGitHubRepo() {
  section('GitHub Repository Check');

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.github.com',
      path: '/repos/umero882/ethiopian-maids-st',
      method: 'GET',
      headers: {
        'User-Agent': 'Ethiopian-Maids-Deploy-Verification',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          const repo = JSON.parse(data);
          log(`${checkMark(true)} Repository exists: ${repo.full_name}`, colors.green);
          log(`  ${checkMark(repo.has_issues)} Issues enabled`);
          log(`  ${checkMark(repo.has_projects)} Projects enabled`);
          log(`  ${checkMark(repo.has_wiki)} Wiki enabled`);
          resolve(true);
        } else {
          log(`${checkMark(false)} Repository not found or not accessible`, colors.red);
          resolve(false);
        }
      });
    });

    req.on('error', (error) => {
      log(`${checkMark(false)} Error checking repository: ${error.message}`, colors.red);
      resolve(false);
    });

    req.end();
  });
}

// Check GitHub workflows
function checkGitHubWorkflows() {
  section('GitHub Workflows Check');

  const workflowsDir = path.join(process.cwd(), '.github', 'workflows');

  if (!fs.existsSync(workflowsDir)) {
    log(`${checkMark(false)} .github/workflows directory not found`, colors.red);
    return false;
  }

  const requiredWorkflows = ['ci.yml', 'deploy.yml'];
  let allPresent = true;

  for (const workflow of requiredWorkflows) {
    const workflowPath = path.join(workflowsDir, workflow);
    const exists = fs.existsSync(workflowPath);
    log(`${checkMark(exists)} ${workflow}`);

    if (!exists) {
      allPresent = false;
    }
  }

  return allPresent;
}

// Check package.json scripts
function checkPackageScripts() {
  section('Package Scripts Check');

  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  const requiredScripts = ['dev', 'build', 'test', 'lint'];
  let allPresent = true;

  for (const script of requiredScripts) {
    const exists = packageJson.scripts && packageJson.scripts[script];
    log(`${checkMark(exists)} npm run ${script}`);

    if (!exists) {
      allPresent = false;
    }
  }

  return allPresent;
}

// Check Vercel configuration
function checkVercelConfig() {
  section('Vercel Configuration Check');

  const vercelPath = path.join(process.cwd(), 'vercel.json');
  const exists = fs.existsSync(vercelPath);

  log(`${checkMark(exists)} vercel.json`);

  if (exists) {
    const config = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
    log(`${checkMark(config.github?.enabled)} GitHub integration enabled`);
    log(`${checkMark(config.builds?.length > 0)} Build configuration present`);
  }

  return exists;
}

// Check documentation
function checkDocumentation() {
  section('Documentation Check');

  const docs = [
    'README.md',
    'BRANCH_STRATEGY.md',
    'VERCEL_SETUP.md',
    'DEPLOYMENT_CHECKLIST.md',
    'POLY_REPO_QUICKSTART.md',
  ];

  let allPresent = true;

  for (const doc of docs) {
    const docPath = path.join(process.cwd(), doc);
    const exists = fs.existsSync(docPath);
    log(`${checkMark(exists)} ${doc}`);

    if (!exists) {
      allPresent = false;
    }
  }

  return allPresent;
}

// Main verification function
async function verifyDeployment() {
  log(`\n${'='.repeat(80)}`, colors.blue);
  log(`  Ethiopian Maids Platform - Deployment Verification`, colors.blue);
  log(`${'='.repeat(80)}`, colors.blue);

  const results = {
    envFile: false,
    envVars: false,
    github: false,
    workflows: false,
    scripts: false,
    vercel: false,
    docs: false,
  };

  // Run checks
  results.envFile = checkEnvFile();

  if (results.envFile) {
    const env = loadEnvFile();
    results.envVars = checkRequiredVars(env);
  }

  results.github = await checkGitHubRepo();
  results.workflows = checkGitHubWorkflows();
  results.scripts = checkPackageScripts();
  results.vercel = checkVercelConfig();
  results.docs = checkDocumentation();

  // Summary
  section('Verification Summary');

  const allPassed = Object.values(results).every(r => r === true);

  log(`\n${checkMark(results.envFile)} Environment file`);
  log(`${checkMark(results.envVars)} Required environment variables`);
  log(`${checkMark(results.github)} GitHub repository`);
  log(`${checkMark(results.workflows)} GitHub workflows`);
  log(`${checkMark(results.scripts)} Package scripts`);
  log(`${checkMark(results.vercel)} Vercel configuration`);
  log(`${checkMark(results.docs)} Documentation`);

  log('\n' + '='.repeat(80), colors.blue);

  if (allPassed) {
    log('\n✅ All checks passed! Ready for deployment.', colors.green);
    log('\nNext steps:', colors.blue);
    log('1. Set up GitHub secrets (see GITHUB_SECRETS_SETUP.md)');
    log('2. Configure Vercel project (see VERCEL_SETUP.md)');
    log('3. Test deployment to development branch');
    log('4. Follow DEPLOYMENT_CHECKLIST.md for complete setup\n');
    process.exit(0);
  } else {
    log('\n❌ Some checks failed. Please fix the issues above.', colors.red);
    log('\nRefer to the documentation for setup instructions:\n', colors.yellow);
    log('- POLY_REPO_QUICKSTART.md - Quick start guide');
    log('- GITHUB_SECRETS_SETUP.md - Configure secrets');
    log('- VERCEL_SETUP.md - Set up Vercel');
    log('- DEPLOYMENT_CHECKLIST.md - Complete deployment guide\n');
    process.exit(1);
  }
}

// Run verification
verifyDeployment().catch(error => {
  log(`\n❌ Verification failed with error: ${error.message}`, colors.red);
  process.exit(1);
});
