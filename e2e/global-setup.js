// Global setup for Playwright tests
async function globalSetup(_config) {
  console.log('🚀 Starting global setup for Maid Registration E2E Tests...');

  // Set up test database if needed
  if (process.env.CI) {
    console.log('CI environment detected - setting up test environment');

    // In CI, you might want to:
    // - Set up test database
    // - Seed test data
    // - Configure test environment variables
  }

  // Set test environment variables
  process.env.PLAYWRIGHT_TEST_MODE = 'true';
  process.env.NODE_ENV = 'test';

  // Create test directories
  const fs = require('fs');
  const path = require('path');

  const testDirs = [
    'test-results',
    'test-results/videos',
    'test-results/screenshots',
    'test-results/traces',
    'playwright-report-maid-registration'
  ];

  testDirs.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created test directory: ${dirPath}`);
    }
  });

  // Set up performance monitoring
  if (process.env.ENABLE_PERFORMANCE_MONITORING) {
    console.log('Performance monitoring enabled');
    // Set up performance monitoring tools
  }

  // Wait for the web server to be ready
  console.log('Waiting for web server to be ready...');
  const { chromium } = require('@playwright/test');
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    // Try to connect to the server with retries
    let retries = 0;
    const maxRetries = 30;

    while (retries < maxRetries) {
      try {
        await page.goto('http://localhost:5173', { timeout: 5000 });
        console.log('✅ Web server is ready');
        break;
      } catch (_error) {
        retries++;
        if (retries === maxRetries) {
          throw new Error(`Web server not ready after ${maxRetries} attempts`);
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log(`Retrying connection to web server (${retries}/${maxRetries})...`);
      }
    }
  } finally {
    await browser.close();
  }

  console.log('✅ Global setup completed successfully');
}

module.exports = globalSetup;
