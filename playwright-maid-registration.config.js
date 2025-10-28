import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration specifically for Maid Registration E2E Tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: [
    '**/maid-registration*.spec.js',
    '**/registration.spec.js'
  ],

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'playwright-report-maid-registration' }],
    ['json', { outputFile: 'test-results/maid-registration-results.json' }],
    ['junit', { outputFile: 'test-results/maid-registration-junit.xml' }]
  ],

  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:5173',

    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',

    /* Record video for failed tests */
    video: 'retain-on-failure',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Global test timeout */
    actionTimeout: 10000,
    navigationTimeout: 30000,

    /* Ignore HTTPS errors */
    ignoreHTTPSErrors: true,

    /* Extra HTTP headers */
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9'
    }
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'] },
    },

    /* Mobile testing */
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },

    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },

    /* Tablet testing */
    {
      name: 'tablet-chrome',
      use: { ...devices['iPad Pro'] },
    },

    /* High DPI testing */
    {
      name: 'high-dpi',
      use: {
        ...devices['Desktop Chrome HiDPI']
      }
    },

    /* Performance testing project */
    {
      name: 'performance',
      testMatch: '**/maid-registration-performance.spec.js',
      use: {
        ...devices['Desktop Chrome'],
        trace: 'on',
        video: 'on'
      },
    },

    /* Security testing project */
    {
      name: 'security',
      testMatch: '**/maid-registration-comprehensive.spec.js',
      use: {
        ...devices['Desktop Chrome'],
        // Enable additional security-focused settings
        javaScriptEnabled: true,
        bypassCSP: false
      },
      grep: /@security|Security Tests/
    },

    /* Accessibility testing */
    {
      name: 'accessibility',
      testMatch: '**/maid-registration-comprehensive.spec.js',
      use: {
        ...devices['Desktop Chrome']
      },
      grep: /@accessibility|Accessibility Tests/
    }
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./e2e/global-setup.js'),
  globalTeardown: require.resolve('./e2e/global-teardown.js'),

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },

  /* Test output directory */
  outputDir: 'test-results/',

  /* Expect settings */
  expect: {
    /* Global expect timeout */
    timeout: 10000,

    /* Screenshot comparison threshold */
    threshold: 0.2,

    /* Screenshot comparison mode */
    mode: 'rgb'
  },

  /* Test metadata */
  metadata: {
    'test-suite': 'Maid Registration E2E Tests',
    'version': '1.0.0',
    'environment': process.env.NODE_ENV || 'development'
  }
});