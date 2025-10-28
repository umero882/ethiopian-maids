// Global teardown for Playwright tests
async function globalTeardown(config) {
  console.log('🧹 Starting global teardown for Maid Registration E2E Tests...');

  // Clean up test data if needed
  if (process.env.CI) {
    console.log('CI environment detected - cleaning up test environment');

    // In CI, you might want to:
    // - Clean up test database
    // - Remove test files
    // - Send test reports to external services
  }

  // Generate test summary report
  const fs = require('fs');
  const path = require('path');

  try {
    const resultsPath = path.join(process.cwd(), 'test-results/maid-registration-results.json');

    if (fs.existsSync(resultsPath)) {
      const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

      console.log('\n📊 Test Results Summary:');
      console.log(`Total Tests: ${results.stats?.total || 0}`);
      console.log(`Passed: ${results.stats?.passed || 0}`);
      console.log(`Failed: ${results.stats?.failed || 0}`);
      console.log(`Skipped: ${results.stats?.skipped || 0}`);
      console.log(`Duration: ${results.stats?.duration || 0}ms`);

      // Check for performance test results
      if (results.suites) {
        const performanceTests = results.suites.filter(suite =>
          suite.title.includes('Performance') || suite.title.includes('Load')
        );

        if (performanceTests.length > 0) {
          console.log('\n⚡ Performance Test Results:');
          performanceTests.forEach(suite => {
            console.log(`- ${suite.title}: ${suite.tests?.length || 0} tests`);
          });
        }
      }

      // Generate performance report if performance data exists
      if (process.env.GENERATE_PERFORMANCE_REPORT) {
        console.log('📈 Generating performance report...');
        // Add performance report generation logic here
      }
    }
  } catch (error) {
    console.log('⚠️  Could not read test results:', error.message);
  }

  // Clean up temporary files
  try {
    const tempFiles = [
      'test-results/temp-*.json',
      'test-results/temp-*.log'
    ];

    tempFiles.forEach(pattern => {
      // Clean up temp files matching pattern
      // Implementation depends on your temp file strategy
    });
  } catch (error) {
    console.log('⚠️  Error cleaning up temp files:', error.message);
  }

  // Archive test artifacts if in CI
  if (process.env.CI && process.env.ARCHIVE_TEST_ARTIFACTS) {
    console.log('📦 Archiving test artifacts...');

    const archivePath = path.join(process.cwd(), 'test-artifacts');

    if (!fs.existsSync(archivePath)) {
      fs.mkdirSync(archivePath, { recursive: true });
    }

    try {
      // Copy important files to archive
      const importantFiles = [
        'test-results/maid-registration-results.json',
        'test-results/maid-registration-junit.xml',
        'playwright-report-maid-registration'
      ];

      importantFiles.forEach(file => {
        const srcPath = path.join(process.cwd(), file);
        const destPath = path.join(archivePath, path.basename(file));

        if (fs.existsSync(srcPath)) {
          if (fs.lstatSync(srcPath).isDirectory()) {
            fs.cpSync(srcPath, destPath, { recursive: true });
          } else {
            fs.copyFileSync(srcPath, destPath);
          }
          console.log(`Archived: ${file}`);
        }
      });
    } catch (error) {
      console.log('⚠️  Error archiving files:', error.message);
    }
  }

  // Send test results to external services if configured
  if (process.env.WEBHOOK_URL) {
    try {
      console.log('📤 Sending test results to webhook...');

      const resultsPath = path.join(process.cwd(), 'test-results/maid-registration-results.json');
      if (fs.existsSync(resultsPath)) {
        const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));

        // Send to webhook
        const fetch = require('node-fetch');
        await fetch(process.env.WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            project: 'Ethio-Maids',
            testSuite: 'Maid Registration E2E',
            results: results.stats,
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV || 'test'
          })
        });

        console.log('✅ Test results sent to webhook');
      }
    } catch (error) {
      console.log('⚠️  Error sending to webhook:', error.message);
    }
  }

  // Clean up environment variables
  delete process.env.PLAYWRIGHT_TEST_MODE;

  console.log('✅ Global teardown completed successfully');
}

module.exports = globalTeardown;
