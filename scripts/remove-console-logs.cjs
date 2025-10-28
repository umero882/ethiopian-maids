#!/usr/bin/env node

/**
 * Console.log Cleanup Script
 * Removes console.log statements while preserving console.warn and console.error
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let totalRemoved = 0;
let filesModified = 0;

// Directories to process
const dirsToProcess = [
  'src/components',
  'src/pages',
  'src/services',
  'src/utils',
  'src/hooks',
  'src/contexts',
  'src/lib',
];

// Directories/files to skip
const skipPatterns = [
  /__tests__/,
  /\.test\./,
  /\.spec\./,
  /node_modules/,
  /dist/,
  /coverage/,
];

/**
 * Check if file should be processed
 */
function shouldProcess(filePath) {
  if (!filePath.match(/\.(js|jsx|ts|tsx)$/)) return false;

  for (const pattern of skipPatterns) {
    if (pattern.test(filePath)) return false;
  }

  return true;
}

/**
 * Remove console.log statements from content
 */
function removeConsoleLogs(content, filePath) {
  let modified = false;
  let removedCount = 0;
  const lines = content.split('\n');
  const newLines = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip if it's a console.warn or console.error
    if (trimmed.match(/console\.(warn|error)/)) {
      newLines.push(line);
      continue;
    }

    // Check for console.log statements
    if (trimmed.match(/console\.log\s*\(/)) {
      // Check if it's a simple single-line console.log
      if (trimmed.match(/console\.log\([^)]*\);?\s*$/)) {
        // Remove the entire line if it's only console.log
        if (trimmed.match(/^\s*console\.log\([^)]*\);?\s*$/)) {
          modified = true;
          removedCount++;
          continue; // Skip this line
        } else {
          // console.log is part of a larger statement, comment it out
          newLines.push(line.replace(/console\.log\([^)]*\);?/, '/* console.log removed */'));
          modified = true;
          removedCount++;
        }
      } else {
        // Multi-line console.log, comment it out
        newLines.push(line.replace(/console\.log/, '/* console.log'));

        // Find the closing parenthesis
        let depth = 0;
        let found = false;
        for (let j = i; j < lines.length && !found; j++) {
          const searchLine = lines[j];
          for (const char of searchLine) {
            if (char === '(') depth++;
            if (char === ')') depth--;
            if (depth === 0 && char === ')') {
              if (j > i) {
                newLines.push(searchLine + ' */');
              } else {
                newLines[newLines.length - 1] += ' */';
              }
              i = j;
              found = true;
              break;
            }
          }
          if (j > i && !found) {
            newLines.push(searchLine);
          }
        }

        modified = true;
        removedCount++;
      }
    } else {
      newLines.push(line);
    }
  }

  if (modified) {
    filesModified++;
    totalRemoved += removedCount;
    console.log(`${colors.green}✓${colors.reset} ${filePath}: Removed ${removedCount} console.log statement(s)`);
  }

  return newLines.join('\n');
}

/**
 * Process a single file
 */
function processFile(filePath) {
  if (!shouldProcess(filePath)) return;

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const newContent = removeConsoleLogs(content, filePath);

    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
    }
  } catch (error) {
    console.error(`${colors.yellow}⚠${colors.reset} Error processing ${filePath}: ${error.message}`);
  }
}

/**
 * Process directory recursively
 */
function processDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.warn(`${colors.yellow}⚠${colors.reset} Directory not found: ${dir}`);
    return;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip node_modules and other excluded directories
      if (!skipPatterns.some(pattern => pattern.test(entry.name))) {
        processDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      processFile(fullPath);
    }
  }
}

// Main execution
console.log(`${colors.cyan}🧹 Console.log Cleanup Tool${colors.reset}`);
console.log(`${colors.blue}=${'='.repeat(50)}${colors.reset}\n`);

console.log(`Processing directories:`);
dirsToProcess.forEach(dir => console.log(`  • ${dir}`));
console.log();

const startTime = Date.now();

for (const dir of dirsToProcess) {
  const fullPath = path.join(process.cwd(), dir);
  processDirectory(fullPath);
}

const endTime = Date.now();
const duration = ((endTime - startTime) / 1000).toFixed(2);

console.log(`\n${colors.blue}=${'='.repeat(50)}${colors.reset}`);
console.log(`${colors.green}✓ Cleanup Complete!${colors.reset}`);
console.log(`  Files modified: ${filesModified}`);
console.log(`  Console.log statements removed: ${totalRemoved}`);
console.log(`  Duration: ${duration}s`);
console.log();
console.log(`${colors.cyan}ℹ${colors.reset} Note: console.warn and console.error were preserved`);
console.log(`${colors.cyan}ℹ${colors.reset} Run 'npm run lint' to verify the changes`);
console.log();
