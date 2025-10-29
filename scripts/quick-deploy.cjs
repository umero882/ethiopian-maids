#!/usr/bin/env node

/**
 * Quick Deploy Script
 * ===================
 * Interactive deployment script that guides you through the deployment process.
 * Runs all necessary checks and deploys to the appropriate environment.
 *
 * Usage:
 *   node scripts/quick-deploy.cjs
 */

const { execSync } = require('child_process');
const readline = require('readline');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function execCommand(command, description) {
  log(`\n🔄 ${description}...`, colors.cyan);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'inherit' });
    log(`✅ ${description} completed`, colors.green);
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, colors.red);
    return false;
  }
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(`${colors.cyan}${question}${colors.reset} `, (answer) => {
      resolve(answer.trim().toLowerCase());
    });
  });
}

async function main() {
  log('\n' + '='.repeat(80), colors.blue);
  log('  Ethiopian Maids Platform - Quick Deploy', colors.blue);
  log('='.repeat(80) + '\n', colors.blue);

  // Step 1: Choose environment
  log('Available environments:', colors.cyan);
  log('  1. Development (preview deployment)');
  log('  2. Staging (preview deployment)');
  log('  3. Production (live deployment)');

  const envChoice = await askQuestion('\nSelect environment (1-3):');

  let environment = 'development';
  let isProduction = false;

  switch (envChoice) {
    case '1':
      environment = 'development';
      break;
    case '2':
      environment = 'staging';
      break;
    case '3':
      environment = 'production';
      isProduction = true;
      break;
    default:
      log('Invalid choice. Defaulting to development.', colors.yellow);
  }

  log(`\n📦 Deploying to: ${colors.green}${environment}${colors.reset}`, colors.cyan);

  if (isProduction) {
    const confirm = await askQuestion(
      '\n⚠️  You are deploying to PRODUCTION. Are you sure? (yes/no):'
    );
    if (confirm !== 'yes') {
      log('\n❌ Deployment cancelled.', colors.yellow);
      rl.close();
      process.exit(0);
    }
  }

  // Step 2: Run pre-deployment checks
  log('\n' + '='.repeat(80), colors.blue);
  log('  Running Pre-Deployment Checks', colors.blue);
  log('='.repeat(80), colors.blue);

  const runChecks = await askQuestion(
    '\nRun pre-deployment verification? (yes/no):'
  );

  if (runChecks === 'yes') {
    const checksPass = execCommand(
      'node scripts/verify-deployment.cjs',
      'Pre-deployment verification'
    );

    if (!checksPass) {
      const continueAnyway = await askQuestion(
        '\n⚠️  Checks failed. Continue anyway? (yes/no):'
      );
      if (continueAnyway !== 'yes') {
        log('\n❌ Deployment cancelled.', colors.yellow);
        rl.close();
        process.exit(1);
      }
    }
  }

  // Step 3: Install dependencies
  const installDeps = await askQuestion('\nInstall/update dependencies? (yes/no):');
  if (installDeps === 'yes') {
    execCommand('npm ci', 'Installing dependencies');
  }

  // Step 4: Run tests
  const runTests = await askQuestion('\nRun tests? (yes/no):');
  if (runTests === 'yes') {
    const testsPass = execCommand('npm test', 'Running tests');
    if (!testsPass && isProduction) {
      log('\n❌ Tests failed. Cannot deploy to production.', colors.red);
      rl.close();
      process.exit(1);
    }
  }

  // Step 5: Build
  log('\n' + '='.repeat(80), colors.blue);
  log('  Building Project', colors.blue);
  log('='.repeat(80), colors.blue);

  const buildPass = execCommand('npm run build', 'Building project');
  if (!buildPass) {
    log('\n❌ Build failed. Cannot deploy.', colors.red);
    rl.close();
    process.exit(1);
  }

  // Step 6: Deploy
  log('\n' + '='.repeat(80), colors.blue);
  log('  Deploying to Vercel', colors.blue);
  log('='.repeat(80), colors.blue);

  const deployCommand = isProduction
    ? 'vercel deploy --prod'
    : 'vercel deploy';

  const deployPass = execCommand(deployCommand, 'Deploying to Vercel');

  if (!deployPass) {
    log('\n❌ Deployment failed.', colors.red);
    rl.close();
    process.exit(1);
  }

  // Step 7: Post-deployment verification
  const verifyDeploy = await askQuestion(
    '\nRun post-deployment verification? (yes/no):'
  );

  if (verifyDeploy === 'yes') {
    const deploymentUrl = await askQuestion(
      '\nEnter deployment URL (or press Enter to skip):'
    );

    if (deploymentUrl) {
      execCommand(
        `node scripts/post-deployment-check.cjs ${deploymentUrl}`,
        'Post-deployment verification'
      );
    }
  }

  // Success!
  log('\n' + '='.repeat(80), colors.green);
  log('  ✅ Deployment Successful!', colors.green);
  log('='.repeat(80) + '\n', colors.green);

  log('Next steps:', colors.cyan);
  log('  1. Test your deployment thoroughly');
  log('  2. Monitor for any errors or issues');
  log('  3. Run health checks: npm run deploy:health');

  if (!isProduction) {
    log('  4. Deploy to production when ready\n');
  } else {
    log('  4. Celebrate! 🎉\n', colors.green);
  }

  rl.close();
}

// Run main
main().catch((error) => {
  log(`\n❌ Deployment failed: ${error.message}`, colors.red);
  console.error(error);
  rl.close();
  process.exit(1);
});
