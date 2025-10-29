#!/usr/bin/env node

/**
 * Deployment Health Monitor
 * =========================
 * Monitors the health of deployed applications across environments.
 * Checks uptime, performance, and critical functionality.
 *
 * Usage:
 *   node scripts/deployment-health-monitor.cjs
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

// Environment configurations
const ENVIRONMENTS = {
  production: {
    name: 'Production',
    url: process.env.PRODUCTION_URL || 'https://ethio-maids.vercel.app',
    critical: true,
  },
  staging: {
    name: 'Staging',
    url: process.env.STAGING_URL || 'https://ethio-maids-staging.vercel.app',
    critical: false,
  },
  development: {
    name: 'Development',
    url: process.env.DEVELOPMENT_URL || 'https://ethio-maids-dev.vercel.app',
    critical: false,
  },
};

// Health check for a single environment
async function checkEnvironmentHealth(envName, config) {
  log(`\n🔍 Checking ${config.name} (${config.url})...`, colors.cyan);

  const checks = {
    accessibility: false,
    responseTime: 0,
    statusCode: 0,
    ssl: false,
  };

  return new Promise((resolve) => {
    const startTime = Date.now();

    const req = https.get(config.url, { timeout: 10000 }, (res) => {
      checks.statusCode = res.statusCode;
      checks.accessibility = res.statusCode === 200;
      checks.responseTime = Date.now() - startTime;
      checks.ssl = true;

      res.on('data', () => {}); // Consume response
      res.on('end', () => {
        resolve(checks);
      });
    });

    req.on('error', (error) => {
      log(`  ❌ Error: ${error.message}`, colors.red);
      resolve(checks);
    });

    req.on('timeout', () => {
      req.destroy();
      log('  ❌ Request timeout', colors.red);
      resolve(checks);
    });
  });
}

// Display health status
function displayHealthStatus(envName, config, checks) {
  const icon = checks.accessibility ? '✅' : '❌';
  const statusColor = checks.accessibility ? colors.green : colors.red;

  log(`\n${icon} ${config.name}`, statusColor);
  log(`  URL: ${config.url}`);
  log(`  Status: ${checks.statusCode || 'N/A'}`);
  log(`  Response Time: ${checks.responseTime}ms`);
  log(`  SSL: ${checks.ssl ? '✅ Enabled' : '❌ Disabled'}`);

  if (checks.accessibility) {
    if (checks.responseTime < 1000) {
      log('  Performance: ✅ Excellent', colors.green);
    } else if (checks.responseTime < 2000) {
      log('  Performance: ⚠️  Good', colors.yellow);
    } else {
      log('  Performance: ⚠️  Slow', colors.yellow);
    }
  }
}

// Generate health report
function generateHealthReport(results) {
  section('Health Report Summary');

  const allHealthy = Object.values(results).every((r) => r.checks.accessibility);
  const criticalHealthy = Object.entries(results)
    .filter(([_, env]) => ENVIRONMENTS[_].critical)
    .every(([_, env]) => env.checks.accessibility);

  log('\nEnvironment Status:', colors.cyan);
  for (const [envName, result] of Object.entries(results)) {
    const status = result.checks.accessibility ? '🟢 Healthy' : '🔴 Down';
    const statusColor = result.checks.accessibility ? colors.green : colors.red;
    log(`  ${ENVIRONMENTS[envName].name}: ${status}`, statusColor);
  }

  log('\nOverall Status:', colors.cyan);
  if (allHealthy) {
    log('  ✅ All environments are healthy', colors.green);
  } else if (criticalHealthy) {
    log('  ⚠️  Some non-critical environments are down', colors.yellow);
  } else {
    log('  ❌ Critical environments are down!', colors.red);
  }

  return { allHealthy, criticalHealthy };
}

// Save health report to file
function saveHealthReport(results) {
  const reportDir = path.join(process.cwd(), '.deployment-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(reportDir, `health-report-${timestamp}.json`);

  const report = {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total: Object.keys(results).length,
      healthy: Object.values(results).filter((r) => r.checks.accessibility).length,
      down: Object.values(results).filter((r) => !r.checks.accessibility).length,
    },
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\n💾 Health report saved to: ${reportPath}`, colors.cyan);
}

// Main monitoring function
async function monitorHealth() {
  log(`\n${'='.repeat(80)}`, colors.blue);
  log('  Ethiopian Maids Platform - Deployment Health Monitor', colors.blue);
  log(`  ${new Date().toLocaleString()}`, colors.cyan);
  log(`${'='.repeat(80)}`, colors.blue);

  const results = {};

  // Check each environment
  for (const [envName, config] of Object.entries(ENVIRONMENTS)) {
    const checks = await checkEnvironmentHealth(envName, config);
    displayHealthStatus(envName, config, checks);
    results[envName] = { config, checks };
  }

  // Generate report
  const { allHealthy, criticalHealthy } = generateHealthReport(results);

  // Save report
  saveHealthReport(results);

  // Exit with appropriate code
  log('\n' + '='.repeat(80), colors.blue);

  if (allHealthy) {
    log('\n✅ All systems operational\n', colors.green);
    process.exit(0);
  } else if (criticalHealthy) {
    log('\n⚠️  Some systems experiencing issues\n', colors.yellow);
    process.exit(0);
  } else {
    log('\n❌ Critical systems down!\n', colors.red);
    process.exit(1);
  }
}

// Run monitor
monitorHealth().catch((error) => {
  log(`\n❌ Health monitor failed: ${error.message}`, colors.red);
  console.error(error);
  process.exit(1);
});
