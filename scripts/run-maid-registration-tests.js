#!/usr/bin/env node

/**
 * Script to run comprehensive maid registration E2E tests
 * Usage: node scripts/run-maid-registration-tests.js [options]
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  browser: 'chromium',
  headless: true,
  ui: false,
  debug: false,
  performance: false,
  security: false,
  accessibility: false,
  mobile: false,
  report: true,
  parallel: true
};

// Parse options
args.forEach(arg => {
  if (arg.startsWith('--browser=')) {
    options.browser = arg.split('=')[1];
  } else if (arg === '--headed') {
    options.headless = false;
  } else if (arg === '--ui') {
    options.ui = true;
  } else if (arg === '--debug') {
    options.debug = true;
    options.headless = false;
  } else if (arg === '--performance') {
    options.performance = true;
  } else if (arg === '--security') {
    options.security = true;
  } else if (arg === '--accessibility') {
    options.accessibility = true;
  } else if (arg === '--mobile') {
    options.mobile = true;
  } else if (arg === '--no-report') {
    options.report = false;
  } else if (arg === '--no-parallel') {
    options.parallel = false;
  }
});

// Color output functions
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(color, text) {
  return `${colors[color]}${text}${colors.reset}`;
}

function log(message, color = 'reset') {
  console.log(colorize(color, message));
}

// Main execution function
async function runTests() {
  log('\n🧪 Maid Registration E2E Test Runner', 'bright');
  log('=====================================\n', 'bright');

  // Check if Playwright is installed
  try {
    require('@playwright/test');
  } catch (error) {
    log('❌ Playwright not found. Please install it:', 'red');
    log('   npm install @playwright/test', 'cyan');
    process.exit(1);
  }

  // Build command arguments
  const playwrightArgs = [];

  // Config file
  playwrightArgs.push('--config=playwright-maid-registration.config.js');

  // Browser selection
  if (options.mobile) {
    playwrightArgs.push('--project=mobile-chrome');
    playwrightArgs.push('--project=mobile-safari');
  } else if (options.performance) {
    playwrightArgs.push('--project=performance');
  } else if (options.security) {
    playwrightArgs.push('--project=security');
  } else if (options.accessibility) {
    playwrightArgs.push('--project=accessibility');
  } else {
    playwrightArgs.push(`--project=${options.browser}-desktop`);
  }

  // Test selection
  if (options.performance) {
    playwrightArgs.push('--grep=Performance|Load');
  } else if (options.security) {
    playwrightArgs.push('--grep=Security|XSS|SQL|CSRF');
  } else if (options.accessibility) {
    playwrightArgs.push('--grep=Accessibility|keyboard|screen reader');
  }

  // Execution options
  if (!options.parallel) {
    playwrightArgs.push('--workers=1');
  }

  if (!options.headless) {
    playwrightArgs.push('--headed');
  }

  if (options.ui) {
    playwrightArgs.push('--ui');
  }

  if (options.debug) {
    playwrightArgs.push('--debug');
    playwrightArgs.push('--timeout=0');
  }

  // Reporting
  if (options.report) {
    playwrightArgs.push('--reporter=html');
  }

  log(`🚀 Running tests with options:`, 'cyan');
  log(`   Browser: ${options.browser}`, 'reset');
  log(`   Headless: ${options.headless}`, 'reset');
  log(`   Parallel: ${options.parallel}`, 'reset');
  log(`   Performance: ${options.performance}`, 'reset');
  log(`   Security: ${options.security}`, 'reset');
  log(`   Accessibility: ${options.accessibility}`, 'reset');
  log(`   Mobile: ${options.mobile}`, 'reset');
  log(`   Report: ${options.report}`, 'reset');
  log('');

  // Create test results directory
  const testResultsDir = path.join(process.cwd(), 'test-results');
  if (!fs.existsSync(testResultsDir)) {
    fs.mkdirSync(testResultsDir, { recursive: true });
  }

  // Run Playwright tests
  return new Promise((resolve, reject) => {
    const npxPath = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const child = spawn(npxPath, ['playwright', 'test', ...playwrightArgs], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    child.on('close', (code) => {
      if (code === 0) {
        log('\n✅ All tests completed successfully!', 'green');

        if (options.report && !options.ui && !options.debug) {
          log('\n📊 Opening test report...', 'cyan');
          const reportPath = path.join(process.cwd(), 'playwright-report-maid-registration', 'index.html');
          if (fs.existsSync(reportPath)) {
            spawn('npx', ['playwright', 'show-report', 'playwright-report-maid-registration'], {
              stdio: 'inherit'
            });
          }
        }

        resolve(0);
      } else {
        log(`\n❌ Tests failed with exit code ${code}`, 'red');

        if (options.report) {
          log('\n📊 Check the test report for details:', 'yellow');
          log('   npx playwright show-report playwright-report-maid-registration', 'cyan');
        }

        reject(code);
      }
    });

    child.on('error', (error) => {
      log(`\n❌ Error running tests: ${error.message}`, 'red');
      reject(error);
    });
  });
}

// Utility functions
function showUsage() {
  log('\n🧪 Maid Registration E2E Test Runner', 'bright');
  log('=====================================\n', 'bright');
  log('Usage: node scripts/run-maid-registration-tests.js [options]\n', 'cyan');
  log('Options:', 'bright');
  log('  --browser=<name>     Browser to use (chromium, firefox, webkit)', 'reset');
  log('  --headed            Run tests in headed mode (visible browser)', 'reset');
  log('  --ui                Open Playwright UI mode', 'reset');
  log('  --debug             Run tests in debug mode', 'reset');
  log('  --performance       Run only performance tests', 'reset');
  log('  --security          Run only security tests', 'reset');
  log('  --accessibility     Run only accessibility tests', 'reset');
  log('  --mobile            Run tests on mobile devices', 'reset');
  log('  --no-report         Disable HTML report generation', 'reset');
  log('  --no-parallel       Run tests sequentially', 'reset');
  log('\nExamples:', 'bright');
  log('  node scripts/run-maid-registration-tests.js', 'cyan');
  log('  node scripts/run-maid-registration-tests.js --headed --browser=firefox', 'cyan');
  log('  node scripts/run-maid-registration-tests.js --performance', 'cyan');
  log('  node scripts/run-maid-registration-tests.js --security --no-parallel', 'cyan');
  log('  node scripts/run-maid-registration-tests.js --mobile', 'cyan');
  log('');
}

// Handle help option
if (args.includes('--help') || args.includes('-h')) {
  showUsage();
  process.exit(0);
}

// Check for required files
const requiredFiles = [
  'playwright-maid-registration.config.js',
  'e2e/maid-registration-comprehensive.spec.js',
  'e2e/maid-registration-performance.spec.js',
  'e2e/maid-registration-validation.spec.js'
];

const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(process.cwd(), file)));

if (missingFiles.length > 0) {
  log('❌ Missing required files:', 'red');
  missingFiles.forEach(file => {
    log(`   ${file}`, 'reset');
  });
  log('\nPlease ensure all test files are in place.', 'yellow');
  process.exit(1);
}

// Run tests
runTests()
  .then((code) => {
    process.exit(code);
  })
  .catch((error) => {
    log(`\n❌ Test execution failed: ${error}`, 'red');
    process.exit(typeof error === 'number' ? error : 1);
  });