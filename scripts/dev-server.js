#!/usr/bin/env node

/**
 * Development Server Helper Script
 *
 * This script starts the development server and automatically opens
 * the correct URL in your browser, avoiding port confusion.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import open from 'open';

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

class DevServer {
  constructor() {
    this.serverUrl = null;
    this.process = null;
  }

  /**
   * Start the development server
   */
  start() {
    log.header('Ethiopian Maids - Development Server');
    log.info('Starting Vite development server...');

    // Start the dev server
    this.process = spawn('npm', ['run', 'dev'], {
      cwd: rootDir,
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
    });

    // Handle stdout to capture server URL
    this.process.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(output);

      // Extract the local URL
      const localMatch = output.match(
        /➜\s+Local:\s+(http:\/\/localhost:\d+\/)/
      );
      if (localMatch && !this.serverUrl) {
        this.serverUrl = localMatch[1];
        this.onServerReady();
      }
    });

    // Handle stderr
    this.process.stderr.on('data', (data) => {
      const output = data.toString();
      if (!output.includes('Port') && !output.includes('ready in')) {
        console.error(output);
      } else {
        console.log(output);
      }
    });

    // Handle process exit
    this.process.on('close', (code) => {
      if (code !== 0) {
        log.error(`Development server exited with code ${code}`);
      } else {
        log.info('Development server stopped');
      }
    });

    // Handle process errors
    this.process.on('error', (error) => {
      log.error(`Failed to start development server: ${error.message}`);
    });

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      log.info('\nShutting down development server...');
      if (this.process) {
        this.process.kill('SIGINT');
      }
      process.exit(0);
    });
  }

  /**
   * Called when server is ready
   */
  onServerReady() {
    log.success(`Development server is ready!`);
    log.info(`Server URL: ${this.serverUrl}`);

    // Wait a moment for server to fully initialize
    setTimeout(() => {
      this.openBrowser();
      this.showQuickLinks();
    }, 1000);
  }

  /**
   * Open browser to the development server
   */
  async openBrowser() {
    try {
      log.info('Opening browser...');
      await open(this.serverUrl);
      log.success('Browser opened successfully');
    } catch (error) {
      log.warning(`Could not open browser automatically: ${error.message}`);
      log.info(`Please manually open: ${this.serverUrl}`);
    }
  }

  /**
   * Show quick links for development
   */
  showQuickLinks() {
    console.log(`
${colors.cyan}${colors.bright}🔗 Quick Development Links:${colors.reset}

${colors.green}📱 Main Application:${colors.reset}
  ${this.serverUrl}

${colors.yellow}🧪 Testing & Debug:${colors.reset}
  ${this.serverUrl}deployment-test    - Deployment verification
  ${this.serverUrl}login              - Login page
  ${this.serverUrl}register           - Registration page
  ${this.serverUrl}complete-profile   - Profile completion

${colors.blue}👥 User Dashboards:${colors.reset}
  ${this.serverUrl}maid-dashboard     - Maid dashboard
  ${this.serverUrl}agency-dashboard   - Agency dashboard  
  ${this.serverUrl}sponsor-dashboard  - Sponsor dashboard

${colors.magenta}🛠️ Development Tools:${colors.reset}
  ${this.serverUrl}agency-profile-tester - Agency form tester

${colors.cyan}💡 Tips:${colors.reset}
  • Press ${colors.bright}Ctrl+C${colors.reset} to stop the server
  • The server will auto-reload when you make changes
  • Check the deployment test page if you encounter issues
  • Mock data is enabled for development

${colors.green}Happy coding! 🎉${colors.reset}
    `);
  }
}

// CLI interface
const args = process.argv.slice(2);
const options = {
  help: args.includes('--help') || args.includes('-h'),
};

if (options.help) {
  console.log(`
Ethiopian Maids - Development Server Helper

Usage: node scripts/dev-server.js [options]

Options:
  --help, -h    Show this help message

This script will:
  • Start the Vite development server
  • Automatically detect the correct port
  • Open your browser to the right URL
  • Show helpful development links
  • Handle graceful shutdown

Examples:
  node scripts/dev-server.js
  npm run dev:helper
  `);
  process.exit(0);
}

// Start the development server
const devServer = new DevServer();
devServer.start();
