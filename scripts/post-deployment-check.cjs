#!/usr/bin/env node

/**
 * Post-Deployment Verification Script
 * ====================================
 * Verifies that a deployed application is functioning correctly.
 * Tests critical endpoints, checks performance, and validates configuration.
 *
 * Usage:
 *   node scripts/post-deployment-check.cjs <deployment-url>
 *   node scripts/post-deployment-check.cjs https://your-app.vercel.app
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

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

function section(title) {
  log(`\n${'='.repeat(80)}`, colors.blue);
  log(`  ${title}`, colors.blue);
  log(`${'='.repeat(80)}`, colors.blue);
}

function checkMark(passed) {
  return passed ? `${colors.green}✅${colors.reset}` : `${colors.red}❌${colors.reset}`;
}

// Get deployment URL from command line
const deploymentUrl = process.argv[2];

if (!deploymentUrl) {
  log('❌ Error: Deployment URL is required', colors.red);
  log('\nUsage: node scripts/post-deployment-check.cjs <deployment-url>', colors.yellow);
  log('Example: node scripts/post-deployment-check.cjs https://your-app.vercel.app\n');
  process.exit(1);
}

// Validate URL format
let parsedUrl;
try {
  parsedUrl = new URL(deploymentUrl);
} catch (error) {
  log(`❌ Error: Invalid URL format: ${deploymentUrl}`, colors.red);
  process.exit(1);
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const startTime = Date.now();

    const req = client.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const endTime = Date.now();
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
          responseTime: endTime - startTime,
        });
      });
    });

    req.on('error', (error) => reject(error));
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Check home page accessibility
async function checkHomePage() {
  section('Home Page Check');

  try {
    const response = await makeRequest(deploymentUrl);

    const statusOk = response.statusCode === 200;
    log(`${checkMark(statusOk)} Status Code: ${response.statusCode}`);

    const hasContent = response.body.length > 0;
    log(`${checkMark(hasContent)} Response has content (${response.body.length} bytes)`);

    const isHTML = response.headers['content-type']?.includes('text/html');
    log(`${checkMark(isHTML)} Content-Type is HTML`);

    const responseTimeOk = response.responseTime < 3000;
    log(
      `${checkMark(responseTimeOk)} Response time: ${response.responseTime}ms ${responseTimeOk ? '' : '(slower than expected)'}`
    );

    return statusOk && hasContent && isHTML;
  } catch (error) {
    log(`${checkMark(false)} Error: ${error.message}`, colors.red);
    return false;
  }
}

// Check security headers
async function checkSecurityHeaders() {
  section('Security Headers Check');

  try {
    const response = await makeRequest(deploymentUrl);
    const headers = response.headers;

    const requiredHeaders = {
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'x-xss-protection': '1; mode=block',
    };

    let allPresent = true;

    for (const [header, expectedValue] of Object.entries(requiredHeaders)) {
      const present = headers[header] !== undefined;
      const matches = headers[header]?.toLowerCase() === expectedValue.toLowerCase();

      log(`${checkMark(present && matches)} ${header}: ${headers[header] || 'missing'}`);

      if (!present || !matches) {
        allPresent = false;
      }
    }

    // Optional but recommended headers
    const optionalHeaders = ['referrer-policy', 'permissions-policy'];

    log('\nOptional Security Headers:', colors.cyan);
    for (const header of optionalHeaders) {
      const present = headers[header] !== undefined;
      log(`  ${checkMark(present)} ${header}: ${headers[header] || 'not set'}`);
    }

    return allPresent;
  } catch (error) {
    log(`${checkMark(false)} Error: ${error.message}`, colors.red);
    return false;
  }
}

// Check static assets
async function checkStaticAssets() {
  section('Static Assets Check');

  const assets = [
    '/favicon.ico',
    '/manifest.json',
    '/robots.txt',
  ];

  let allAccessible = true;

  for (const asset of assets) {
    const assetUrl = `${deploymentUrl}${asset}`;
    try {
      const response = await makeRequest(assetUrl);
      const accessible = response.statusCode === 200 || response.statusCode === 404; // 404 is OK for optional assets
      log(`${checkMark(accessible)} ${asset} - Status: ${response.statusCode}`);

      if (response.statusCode !== 200 && response.statusCode !== 404) {
        allAccessible = false;
      }
    } catch (error) {
      log(`${checkMark(false)} ${asset} - Error: ${error.message}`);
      allAccessible = false;
    }
  }

  return allAccessible;
}

// Check SPA routing
async function checkSPARouting() {
  section('SPA Routing Check');

  const routes = ['/', '/dashboard', '/login', '/non-existent-route'];

  let allRoutesWork = true;

  for (const route of routes) {
    const routeUrl = `${deploymentUrl}${route}`;
    try {
      const response = await makeRequest(routeUrl);

      // All routes should return 200 (SPA handles routing client-side)
      const works = response.statusCode === 200;
      log(`${checkMark(works)} ${route} - Status: ${response.statusCode}`);

      if (!works) {
        allRoutesWork = false;
      }
    } catch (error) {
      log(`${checkMark(false)} ${route} - Error: ${error.message}`);
      allRoutesWork = false;
    }
  }

  return allRoutesWork;
}

// Check performance
async function checkPerformance() {
  section('Performance Check');

  const iterations = 3;
  const responseTimes = [];

  log(`Running ${iterations} requests to measure average response time...`, colors.cyan);

  for (let i = 0; i < iterations; i++) {
    try {
      const response = await makeRequest(deploymentUrl);
      responseTimes.push(response.responseTime);
      log(`  Request ${i + 1}: ${response.responseTime}ms`);
    } catch (error) {
      log(`  Request ${i + 1}: Failed - ${error.message}`, colors.red);
    }
  }

  if (responseTimes.length > 0) {
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);

    log(`\n${checkMark(avgResponseTime < 2000)} Average: ${avgResponseTime.toFixed(2)}ms`, avgResponseTime < 2000 ? colors.green : colors.yellow);
    log(`  Minimum: ${minResponseTime}ms`);
    log(`  Maximum: ${maxResponseTime}ms`);

    return avgResponseTime < 3000; // Pass if average is under 3 seconds
  }

  return false;
}

// Check environment-specific features
async function checkEnvironment() {
  section('Environment Detection');

  try {
    const response = await makeRequest(deploymentUrl);

    // Check if it's a Vercel deployment
    const isVercel = response.headers['x-vercel-id'] !== undefined;
    log(`${checkMark(isVercel)} Vercel deployment detected`);

    if (isVercel) {
      log(`  Vercel ID: ${response.headers['x-vercel-id']}`);
      log(`  Cache: ${response.headers['x-vercel-cache'] || 'not set'}`);
    }

    return true;
  } catch (error) {
    log(`${checkMark(false)} Error: ${error.message}`, colors.red);
    return false;
  }
}

// Main verification function
async function verifyDeployment() {
  log(`\n${'='.repeat(80)}`, colors.blue);
  log(`  Post-Deployment Verification for Ethiopian Maids Platform`, colors.blue);
  log(`  URL: ${deploymentUrl}`, colors.cyan);
  log(`${'='.repeat(80)}`, colors.blue);

  const results = {
    homePage: false,
    security: false,
    assets: false,
    routing: false,
    performance: false,
    environment: false,
  };

  // Run all checks
  results.homePage = await checkHomePage();
  results.security = await checkSecurityHeaders();
  results.assets = await checkStaticAssets();
  results.routing = await checkSPARouting();
  results.performance = await checkPerformance();
  results.environment = await checkEnvironment();

  // Summary
  section('Verification Summary');

  log(`\n${checkMark(results.homePage)} Home page accessibility`);
  log(`${checkMark(results.security)} Security headers`);
  log(`${checkMark(results.assets)} Static assets`);
  log(`${checkMark(results.routing)} SPA routing`);
  log(`${checkMark(results.performance)} Performance`);
  log(`${checkMark(results.environment)} Environment detection`);

  log('\n' + '='.repeat(80), colors.blue);

  const allPassed = Object.values(results).every((r) => r === true);
  const criticalPassed = results.homePage && results.routing;

  if (allPassed) {
    log('\n✅ All checks passed! Deployment is fully functional.', colors.green);
    log(`\n🎉 Your application is live at: ${deploymentUrl}\n`, colors.green);
    process.exit(0);
  } else if (criticalPassed) {
    log('\n⚠️  Some non-critical checks failed, but deployment is functional.', colors.yellow);
    log(`\n✅ Your application is live at: ${deploymentUrl}`, colors.green);
    log('💡 Consider addressing the warnings above for optimal security and performance.\n', colors.yellow);
    process.exit(0);
  } else {
    log('\n❌ Critical checks failed. Deployment may not be functioning correctly.', colors.red);
    log('Please review the errors above and redeploy if necessary.\n', colors.red);
    process.exit(1);
  }
}

// Run verification
verifyDeployment().catch((error) => {
  log(`\n❌ Verification failed with error: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
