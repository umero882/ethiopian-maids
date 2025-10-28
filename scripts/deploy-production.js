#!/usr/bin/env node

/**
 * 🚀 Production Deployment Script
 * Comprehensive deployment automation with health checks and monitoring
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk');

class ProductionDeployer {
  constructor() {
    this.startTime = Date.now();
    this.deploymentId = `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.config = this.loadConfig();
    this.steps = [];
  }

  loadConfig() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      return {
        name: packageJson.name,
        version: packageJson.version,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
      };
    } catch (error) {
      this.logError('Failed to load package.json', error);
      process.exit(1);
    }
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red,
      step: chalk.cyan,
    };

    const coloredMessage = colors[type] ? colors[type](message) : message;
    console.log(`[${timestamp}] ${coloredMessage}`);
  }

  logStep(step, message) {
    this.log(`📋 STEP ${step}: ${message}`, 'step');
    this.steps.push({ step, message, timestamp: Date.now() });
  }

  logSuccess(message) {
    this.log(`✅ ${message}`, 'success');
  }

  logWarning(message) {
    this.log(`⚠️  ${message}`, 'warning');
  }

  logError(message, error = null) {
    this.log(`❌ ${message}`, 'error');
    if (error) {
      console.error(error);
    }
  }

  async runCommand(command, description) {
    this.log(`Running: ${command}`);
    try {
      const output = execSync(command, {
        encoding: 'utf8',
        stdio: 'pipe',
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });
      this.logSuccess(`${description} completed`);
      return output;
    } catch (error) {
      this.logError(`${description} failed`, error);
      throw error;
    }
  }

  async checkPrerequisites() {
    this.logStep(1, 'Checking Prerequisites');

    // Check Node.js version
    const nodeVersion = process.version;
    this.log(`Node.js version: ${nodeVersion}`);

    // Check if we're in the right directory
    if (!fs.existsSync('package.json')) {
      throw new Error('package.json not found. Are you in the project root?');
    }

    // Check if .env.production exists
    if (!fs.existsSync('.env.production')) {
      this.logWarning(
        '.env.production not found. Make sure to configure production environment variables.'
      );
    }

    // Check Git status
    try {
      const gitStatus = execSync('git status --porcelain', {
        encoding: 'utf8',
      });
      if (gitStatus.trim()) {
        this.logWarning('Working directory has uncommitted changes');
      } else {
        this.logSuccess('Working directory is clean');
      }
    } catch (error) {
      this.logWarning('Git not available or not a git repository');
    }

    this.logSuccess('Prerequisites check completed');
  }

  async runTests() {
    this.logStep(2, 'Running Tests');

    try {
      await this.runCommand('npm test -- --passWithNoTests --ci', 'Test suite');
      this.logSuccess('All tests passed');
    } catch (error) {
      this.logError('Tests failed. Deployment aborted.');
      throw error;
    }
  }

  async buildApplication() {
    this.logStep(3, 'Building Application');

    // Clean previous build
    if (fs.existsSync('dist')) {
      await this.runCommand('rm -rf dist', 'Clean previous build');
    }

    // Build for production
    await this.runCommand('npm run build', 'Production build');

    // Verify build output
    if (!fs.existsSync('dist/index.html')) {
      throw new Error('Build failed: dist/index.html not found');
    }

    // Get build size information
    const buildStats = this.getBuildStats();
    this.log(
      `Build completed: ${buildStats.totalSize} total, ${buildStats.gzipSize} gzipped`
    );

    this.logSuccess('Application built successfully');
  }

  getBuildStats() {
    try {
      const distPath = path.join(process.cwd(), 'dist');
      let totalSize = 0;
      let fileCount = 0;

      const calculateSize = (dir) => {
        const files = fs.readdirSync(dir);
        files.forEach((file) => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory()) {
            calculateSize(filePath);
          } else {
            totalSize += stat.size;
            fileCount++;
          }
        });
      };

      calculateSize(distPath);

      return {
        totalSize: this.formatBytes(totalSize),
        gzipSize: 'N/A', // Would need actual gzip calculation
        fileCount,
      };
    } catch (error) {
      return { totalSize: 'Unknown', gzipSize: 'Unknown', fileCount: 0 };
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async performSecurityCheck() {
    this.logStep(4, 'Security Check');

    try {
      // Check for security vulnerabilities
      await this.runCommand('npm audit --audit-level=high', 'Security audit');
      this.logSuccess('No high-severity vulnerabilities found');
    } catch (error) {
      this.logWarning(
        'Security audit found issues. Review before deploying to production.'
      );
      // Don't fail deployment for audit issues, just warn
    }

    // Check for sensitive files in build
    const sensitivePatterns = ['.env', 'private', 'secret', 'key'];
    const buildFiles = this.getAllFiles('dist');
    const sensitiveFiles = buildFiles.filter((file) =>
      sensitivePatterns.some((pattern) => file.toLowerCase().includes(pattern))
    );

    if (sensitiveFiles.length > 0) {
      this.logWarning(
        `Potentially sensitive files found in build: ${sensitiveFiles.join(', ')}`
      );
    } else {
      this.logSuccess('No sensitive files detected in build');
    }
  }

  getAllFiles(dir, files = []) {
    try {
      const dirFiles = fs.readdirSync(dir);
      dirFiles.forEach((file) => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
          this.getAllFiles(filePath, files);
        } else {
          files.push(filePath);
        }
      });
    } catch (error) {
      // Ignore errors
    }
    return files;
  }

  async deployToVercel() {
    this.logStep(5, 'Deploying to Vercel');

    try {
      // Check if Vercel CLI is installed
      await this.runCommand('vercel --version', 'Check Vercel CLI');

      // Deploy to production
      const deployOutput = await this.runCommand(
        'vercel --prod --yes',
        'Deploy to Vercel'
      );

      // Extract deployment URL
      const urlMatch = deployOutput.match(/https:\/\/[^\s]+/);
      const deploymentUrl = urlMatch ? urlMatch[0] : 'Unknown';

      this.logSuccess(`Deployed to: ${deploymentUrl}`);
      return deploymentUrl;
    } catch (error) {
      this.logError('Vercel deployment failed', error);
      throw error;
    }
  }

  async deployToNetlify() {
    this.logStep(5, 'Deploying to Netlify');

    try {
      // Check if Netlify CLI is installed
      await this.runCommand('netlify --version', 'Check Netlify CLI');

      // Deploy to production
      const deployOutput = await this.runCommand(
        'netlify deploy --prod --dir=dist',
        'Deploy to Netlify'
      );

      // Extract deployment URL
      const urlMatch = deployOutput.match(/Website URL: (https:\/\/[^\s]+)/);
      const deploymentUrl = urlMatch ? urlMatch[1] : 'Unknown';

      this.logSuccess(`Deployed to: ${deploymentUrl}`);
      return deploymentUrl;
    } catch (error) {
      this.logError('Netlify deployment failed', error);
      throw error;
    }
  }

  async performHealthCheck(deploymentUrl) {
    this.logStep(6, 'Health Check');

    if (!deploymentUrl || deploymentUrl === 'Unknown') {
      this.logWarning('Skipping health check - deployment URL unknown');
      return;
    }

    try {
      // Wait a bit for deployment to be ready
      await new Promise((resolve) => setTimeout(resolve, 10000));

      // Simple HTTP check
      const response = await fetch(deploymentUrl);
      if (response.ok) {
        this.logSuccess(`Health check passed: ${response.status}`);
      } else {
        this.logWarning(`Health check warning: ${response.status}`);
      }
    } catch (error) {
      this.logWarning(`Health check failed: ${error.message}`);
    }
  }

  async generateDeploymentReport() {
    this.logStep(7, 'Generating Deployment Report');

    const endTime = Date.now();
    const duration = endTime - this.startTime;

    const report = {
      deploymentId: this.deploymentId,
      timestamp: new Date().toISOString(),
      duration: `${Math.round(duration / 1000)}s`,
      config: this.config,
      steps: this.steps,
      success: true,
    };

    // Save report
    const reportPath = `deployment-reports/deployment-${this.deploymentId}.json`;
    if (!fs.existsSync('deployment-reports')) {
      fs.mkdirSync('deployment-reports', { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.logSuccess(`Deployment report saved: ${reportPath}`);

    return report;
  }

  async deploy(platform = 'vercel') {
    try {
      this.log(
        `🚀 Starting production deployment for ${this.config.name} v${this.config.version}`
      );
      this.log(`Deployment ID: ${this.deploymentId}`);

      await this.checkPrerequisites();
      await this.runTests();
      await this.buildApplication();
      await this.performSecurityCheck();

      let deploymentUrl;
      if (platform === 'vercel') {
        deploymentUrl = await this.deployToVercel();
      } else if (platform === 'netlify') {
        deploymentUrl = await this.deployToNetlify();
      } else {
        throw new Error(`Unsupported platform: ${platform}`);
      }

      await this.performHealthCheck(deploymentUrl);
      const report = await this.generateDeploymentReport();

      const duration = Date.now() - this.startTime;
      this.logSuccess(
        `🎉 Deployment completed successfully in ${Math.round(duration / 1000)}s`
      );
      this.logSuccess(`🌐 Live at: ${deploymentUrl}`);

      return report;
    } catch (error) {
      this.logError('❌ Deployment failed', error);

      // Generate failure report
      const report = {
        deploymentId: this.deploymentId,
        timestamp: new Date().toISOString(),
        duration: `${Math.round((Date.now() - this.startTime) / 1000)}s`,
        config: this.config,
        steps: this.steps,
        success: false,
        error: error.message,
      };

      const reportPath = `deployment-reports/deployment-${this.deploymentId}-FAILED.json`;
      if (!fs.existsSync('deployment-reports')) {
        fs.mkdirSync('deployment-reports', { recursive: true });
      }
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

      process.exit(1);
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const platform = args[0] || 'vercel';

  if (!['vercel', 'netlify'].includes(platform)) {
    console.error('Usage: node deploy-production.js [vercel|netlify]');
    process.exit(1);
  }

  const deployer = new ProductionDeployer();
  await deployer.deploy(platform);
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Deployment script failed:', error);
    process.exit(1);
  });
}

module.exports = ProductionDeployer;
