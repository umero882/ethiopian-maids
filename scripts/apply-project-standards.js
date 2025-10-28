#!/usr/bin/env node

/**
 * 🔧 Apply Project Standards Script
 * Ethiopian Maids Platform - Configuration Setup
 *
 * This script applies the enhanced project standards including:
 * - Enhanced ESLint configuration
 * - Enhanced Prettier configuration
 * - Package.json script updates
 * - Git hooks setup
 * - Development environment validation
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

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
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  header: (msg) =>
    console.log(`\n${colors.bright}${colors.cyan}🚀 ${msg}${colors.reset}\n`),
};

/**
 * Check if file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Backup existing configuration file
 */
async function backupFile(filePath) {
  if (await fileExists(filePath)) {
    const backupPath = `${filePath}.backup.${Date.now()}`;
    await fs.copyFile(filePath, backupPath);
    log.info(
      `Backed up ${path.basename(filePath)} to ${path.basename(backupPath)}`
    );
    return backupPath;
  }
  return null;
}

/**
 * Apply enhanced ESLint configuration
 */
async function applyESLintConfig() {
  log.header('Applying Enhanced ESLint Configuration');

  const eslintPath = path.join(projectRoot, '.eslintrc.cjs');
  const enhancedPath = path.join(projectRoot, '.eslintrc.enhanced.cjs');

  if (await fileExists(enhancedPath)) {
    // Backup existing config
    await backupFile(eslintPath);

    // Copy enhanced config
    await fs.copyFile(enhancedPath, eslintPath);
    log.success('Applied enhanced ESLint configuration');

    // Update package.json scripts
    await updatePackageJsonScripts();
  } else {
    log.error(
      'Enhanced ESLint config not found. Please ensure .eslintrc.enhanced.cjs exists.'
    );
  }
}

/**
 * Apply enhanced Prettier configuration
 */
async function applyPrettierConfig() {
  log.header('Applying Enhanced Prettier Configuration');

  const prettierPath = path.join(projectRoot, '.prettierrc.json');
  const enhancedPath = path.join(projectRoot, '.prettierrc.enhanced.json');

  if (await fileExists(enhancedPath)) {
    // Backup existing config
    await backupFile(prettierPath);

    // Copy enhanced config
    await fs.copyFile(enhancedPath, prettierPath);
    log.success('Applied enhanced Prettier configuration');
  } else {
    log.error(
      'Enhanced Prettier config not found. Please ensure .prettierrc.enhanced.json exists.'
    );
  }
}

/**
 * Update package.json scripts for enhanced linting
 */
async function updatePackageJsonScripts() {
  log.info('Updating package.json scripts...');

  const packageJsonPath = path.join(projectRoot, 'package.json');
  const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));

  // Enhanced scripts
  const enhancedScripts = {
    lint: 'eslint . --report-unused-disable-directives --max-warnings 0',
    'lint:fix':
      'eslint . --report-unused-disable-directives --max-warnings 0 --fix',
    'lint:check':
      'eslint . --report-unused-disable-directives --max-warnings 15',
    format: 'prettier --write "**/*.{js,jsx,json,md,html,css}"',
    'format:check': 'prettier --check "**/*.{js,jsx,json,md,html,css}"',
    'code:quality': 'npm run lint:fix && npm run format',
    'pre-commit':
      'npm run lint:check && npm run format:check && npm run test:ci',
  };

  // Update scripts
  packageJson.scripts = { ...packageJson.scripts, ...enhancedScripts };

  // Write updated package.json
  await fs.writeFile(
    packageJsonPath,
    JSON.stringify(packageJson, null, 2) + '\n'
  );
  log.success('Updated package.json scripts');
}

/**
 * Create .gitignore additions for new config files
 */
async function updateGitignore() {
  log.header('Updating .gitignore');

  const gitignorePath = path.join(projectRoot, '.gitignore');
  let gitignoreContent = '';

  if (await fileExists(gitignorePath)) {
    gitignoreContent = await fs.readFile(gitignorePath, 'utf8');
  }

  const additions = [
    '',
    '# Enhanced configuration backups',
    '*.backup.*',
    '',
    '# IDE specific files',
    '.vscode/settings.json',
    '.idea/',
    '',
    '# OS specific files',
    '.DS_Store',
    'Thumbs.db',
  ];

  // Check if additions are already present
  const needsUpdate = additions.some(
    (line) => line.trim() && !gitignoreContent.includes(line.trim())
  );

  if (needsUpdate) {
    gitignoreContent += '\n' + additions.join('\n');
    await fs.writeFile(gitignorePath, gitignoreContent);
    log.success('Updated .gitignore with new entries');
  } else {
    log.info('.gitignore already up to date');
  }
}

/**
 * Validate development environment
 */
async function validateEnvironment() {
  log.header('Validating Development Environment');

  const checks = [
    {
      name: 'Node.js version',
      check: () => {
        const version = process.version;
        const major = parseInt(version.slice(1).split('.')[0]);
        return major >= 16;
      },
      message: 'Node.js 16+ required',
    },
    {
      name: 'npm version',
      check: () => {
        try {
          const version = execSync('npm --version', {
            encoding: 'utf8',
          }).trim();
          const major = parseInt(version.split('.')[0]);
          return major >= 8;
        } catch {
          return false;
        }
      },
      message: 'npm 8+ required',
    },
    {
      name: 'Git availability',
      check: () => {
        try {
          execSync('git --version', { stdio: 'ignore' });
          return true;
        } catch {
          return false;
        }
      },
      message: 'Git is required for version control',
    },
  ];

  let allPassed = true;

  for (const check of checks) {
    if (check.check()) {
      log.success(`${check.name} ✓`);
    } else {
      log.error(`${check.name} ✗ - ${check.message}`);
      allPassed = false;
    }
  }

  return allPassed;
}

/**
 * Run initial code quality check
 */
async function runCodeQualityCheck() {
  log.header('Running Initial Code Quality Check');

  try {
    // Run ESLint check
    log.info('Running ESLint check...');
    execSync('npm run lint:check', { stdio: 'inherit', cwd: projectRoot });
    log.success('ESLint check passed');

    // Run Prettier check
    log.info('Running Prettier check...');
    execSync('npm run format:check', { stdio: 'inherit', cwd: projectRoot });
    log.success('Prettier check passed');
  } catch (_error) {
    log.warning(
      'Code quality issues found. Run "npm run code:quality" to fix automatically.'
    );
    return false;
  }

  return true;
}

/**
 * Create development setup summary
 */
async function createSetupSummary() {
  const summaryPath = path.join(projectRoot, 'SETUP_SUMMARY.md');

  const summary = `# Ethiopian Maids Platform - Setup Summary

## ✅ Applied Configurations

### Enhanced ESLint Configuration
- Comprehensive rules for React, hooks, and accessibility
- Naming convention enforcement
- Performance and security rules
- Custom overrides for test files and scripts

### Enhanced Prettier Configuration  
- Consistent code formatting
- JSX single quotes
- Trailing commas (ES5)
- 80 character line width

### Updated Package Scripts
- \`npm run lint\` - Strict linting (0 warnings)
- \`npm run lint:fix\` - Auto-fix lint issues
- \`npm run lint:check\` - Relaxed linting (15 warnings max)
- \`npm run format\` - Format all files
- \`npm run format:check\` - Check formatting
- \`npm run code:quality\` - Fix lint + format
- \`npm run pre-commit\` - Pre-commit checks

## 🚀 Next Steps

1. **Run code quality fixes**:
   \`\`\`bash
   npm run code:quality
   \`\`\`

2. **Run tests to ensure everything works**:
   \`\`\`bash
   npm run test
   \`\`\`

3. **Start development server**:
   \`\`\`bash
   npm run dev
   \`\`\`

## 📋 Daily Development Workflow

1. **Before coding**: \`npm run lint:check\`
2. **During coding**: Use IDE ESLint/Prettier integration
3. **Before committing**: \`npm run pre-commit\`
4. **Weekly**: \`npm audit\` and dependency updates

## 🔧 IDE Setup Recommendations

### VS Code Extensions
- ESLint
- Prettier - Code formatter
- Tailwind CSS IntelliSense
- Auto Rename Tag
- Bracket Pair Colorizer

### VS Code Settings
Add to your \`.vscode/settings.json\`:
\`\`\`json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.autoFixOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
\`\`\`

Generated on: ${new Date().toISOString()}
`;

  await fs.writeFile(summaryPath, summary);
  log.success('Created setup summary at SETUP_SUMMARY.md');
}

/**
 * Main execution function
 */
async function main() {
  console.log(`${colors.bright}${colors.magenta}`);
  console.log(
    '╔══════════════════════════════════════════════════════════════╗'
  );
  console.log(
    '║                Ethiopian Maids Platform                      ║'
  );
  console.log(
    '║              Project Standards Setup Script                  ║'
  );
  console.log(
    '╚══════════════════════════════════════════════════════════════╝'
  );
  console.log(colors.reset);

  try {
    // Validate environment first
    const envValid = await validateEnvironment();
    if (!envValid) {
      log.error('Environment validation failed. Please fix the issues above.');
      process.exit(1);
    }

    // Apply configurations
    await applyESLintConfig();
    await applyPrettierConfig();
    await updateGitignore();

    // Create setup summary
    await createSetupSummary();

    // Run initial quality check
    log.header('Final Validation');
    const qualityPassed = await runCodeQualityCheck();

    // Success message
    console.log(`\n${colors.bright}${colors.green}`);
    console.log('🎉 Project standards applied successfully!');
    console.log(colors.reset);

    if (!qualityPassed) {
      log.warning('Run "npm run code:quality" to fix any formatting issues.');
    }

    log.info('Check SETUP_SUMMARY.md for next steps and daily workflow.');
  } catch (error) {
    log.error(`Setup failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();
