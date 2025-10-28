#!/usr/bin/env node

/**
 * String Extraction Script for i18n
 *
 * Scans React/JSX files for hard-coded English strings and extracts them
 * into a structured JSON format for translation.
 *
 * Usage:
 *   node scripts/extract-strings.js [--output path] [--dry-run] [--merge]
 *
 * Options:
 *   --output FILE    Output file path (default: locales/extracted.json)
 *   --dry-run        Print extracted strings without writing files
 *   --merge          Merge with existing en.json instead of creating new file
 *   --src PATH       Source directory to scan (default: ../../src)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  srcDir: path.resolve(__dirname, '../../../src'),
  outputFile: path.resolve(__dirname, '../locales/extracted.json'),
  enJsonFile: path.resolve(__dirname, '../locales/en.json'),
  dryRun: false,
  merge: false,
  verbose: false,
};

// Parse command line arguments
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--output' && args[i + 1]) {
    config.outputFile = path.resolve(args[i + 1]);
    i++;
  } else if (args[i] === '--src' && args[i + 1]) {
    config.srcDir = path.resolve(args[i + 1]);
    i++;
  } else if (args[i] === '--dry-run') {
    config.dryRun = true;
  } else if (args[i] === '--merge') {
    config.merge = true;
  } else if (args[i] === '--verbose' || args[i] === '-v') {
    config.verbose = true;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
String Extraction Tool for i18n

Usage:
  node scripts/extract-strings.js [options]

Options:
  --output FILE    Output file path (default: locales/extracted.json)
  --src PATH       Source directory to scan (default: ../../src)
  --dry-run        Print extracted strings without writing files
  --merge          Merge with existing en.json
  --verbose, -v    Verbose output
  --help, -h       Show this help message

Examples:
  # Extract strings to extracted.json
  node scripts/extract-strings.js

  # Merge with existing en.json
  node scripts/extract-strings.js --merge

  # Preview without writing
  node scripts/extract-strings.js --dry-run
`);
    process.exit(0);
  }
}

// Patterns to extract strings
const patterns = [
  // JSX text content: <div>Text here</div>
  {
    name: 'JSX Text Content',
    regex: />([A-Z][^<>{}\n]{3,100})</g,
    extract: (match) => match[1].trim(),
    filter: (text) => {
      // Filter out common non-translatable patterns
      if (text.length < 3) return false;
      if (/^[0-9\s\-:./]+$/.test(text)) return false; // Numbers, dates, etc.
      if (/^[A-Z_]+$/.test(text)) return false; // Constants
      if (text.includes('{{') || text.includes('}}')) return false; // Already using interpolation
      if (text.startsWith('import ') || text.startsWith('export ')) return false;
      return true;
    }
  },

  // String literals in props: placeholder="Text", title="Text", etc.
  {
    name: 'String Props',
    regex: /(placeholder|title|alt|aria-label|label|name)=["']([^"']{3,100})["']/g,
    extract: (match) => match[2].trim(),
    filter: (text) => {
      if (text.length < 3) return false;
      if (/^[a-z_-]+$/.test(text)) return false; // CSS classes, IDs
      if (/^\d+$/.test(text)) return false; // Pure numbers
      return true;
    }
  },

  // Button/Link text patterns
  {
    name: 'Button/Link Text',
    regex: /<(button|a)[^>]*>([A-Z][^<>]{2,50})<\/(button|a)>/g,
    extract: (match) => match[2].trim(),
    filter: (text) => {
      if (text.length < 2) return false;
      if (/^[0-9\s]+$/.test(text)) return false;
      return true;
    }
  },

  // Heading text
  {
    name: 'Headings',
    regex: /<h[1-6][^>]*>([A-Z][^<>]{3,100})<\/h[1-6]>/g,
    extract: (match) => match[1].trim(),
    filter: (text) => text.length >= 3
  },

  // Alert/Toast/Error messages
  {
    name: 'Messages',
    regex: /(alert|toast|error|success|warning|info)\s*\(\s*["']([^"']{10,200})["']\s*\)/g,
    extract: (match) => match[2].trim(),
    filter: (text) => text.length >= 10
  },

  // Validation messages
  {
    name: 'Validation',
    regex: /message:\s*["']([^"']{5,150})["']/g,
    extract: (match) => match[1].trim(),
    filter: (text) => text.length >= 5
  }
];

// Statistics
const stats = {
  filesScanned: 0,
  stringsFound: 0,
  uniqueStrings: 0,
  byCategory: {},
};

// Extracted strings with metadata
const extractedStrings = new Map();

/**
 * Scan a file for translatable strings
 */
function scanFile(filePath) {
  stats.filesScanned++;

  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(config.srcDir, filePath);

  if (config.verbose) {
    console.log(`Scanning: ${relativePath}`);
  }

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.regex.exec(content)) !== null) {
      const extracted = pattern.extract(match);

      if (!extracted || !pattern.filter(extracted)) {
        continue;
      }

      stats.stringsFound++;

      // Store with metadata
      if (!extractedStrings.has(extracted)) {
        extractedStrings.set(extracted, {
          text: extracted,
          occurrences: [],
          category: pattern.name,
        });
      }

      extractedStrings.get(extracted).occurrences.push({
        file: relativePath,
        line: getLineNumber(content, match.index),
      });
    }
  });
}

/**
 * Get line number for a string index
 */
function getLineNumber(content, index) {
  return content.substring(0, index).split('\n').length;
}

/**
 * Recursively scan directory
 */
function scanDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    return;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name);

    // Skip node_modules, dist, build, etc.
    if (entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name === 'build' ||
        entry.name === '.git' ||
        entry.name.startsWith('.')) {
      return;
    }

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile()) {
      // Only scan JS/JSX files
      if (/\.(jsx?|tsx?)$/.test(entry.name)) {
        try {
          scanFile(fullPath);
        } catch (error) {
          console.error(`Error scanning ${fullPath}:`, error.message);
        }
      }
    }
  });
}

/**
 * Generate key from text
 */
function generateKey(text, category) {
  // Create a key from the text
  const normalized = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 50);

  const categoryPrefix = category.toLowerCase().replace(/[^a-z]+/g, '_');

  return `${categoryPrefix}.${normalized}`;
}

/**
 * Group strings by category
 */
function groupByCategory() {
  const grouped = {};

  extractedStrings.forEach((data, text) => {
    const category = data.category.toLowerCase().replace(/[^a-z]+/g, '_');

    if (!grouped[category]) {
      grouped[category] = {};
      stats.byCategory[category] = 0;
    }

    const key = generateKey(text, category);
    grouped[category][key] = {
      text,
      occurrences: data.occurrences,
    };

    stats.byCategory[category]++;
  });

  stats.uniqueStrings = extractedStrings.size;
  return grouped;
}

/**
 * Generate flat translation object
 */
function generateTranslations(grouped) {
  const translations = {};

  Object.keys(grouped).forEach(category => {
    translations[category] = {};

    Object.keys(grouped[category]).forEach(key => {
      translations[category][key] = grouped[category][key].text;
    });
  });

  return translations;
}

/**
 * Merge with existing en.json
 */
function mergeWithExisting(newTranslations) {
  if (!fs.existsSync(config.enJsonFile)) {
    console.log('No existing en.json found, creating new file');
    return newTranslations;
  }

  const existing = JSON.parse(fs.readFileSync(config.enJsonFile, 'utf-8'));

  // Deep merge
  function deepMerge(target, source) {
    const result = { ...target };

    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(result[key] || {}, source[key]);
      } else {
        // Only add if not already present
        if (!(key in result)) {
          result[key] = source[key];
        }
      }
    });

    return result;
  }

  return deepMerge(existing, newTranslations);
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Ethiopian Maids i18n String Extractor\n');
  console.log(`Source directory: ${config.srcDir}`);
  console.log(`Output file: ${config.outputFile}`);
  console.log(`Mode: ${config.dryRun ? 'DRY RUN' : 'WRITE'}`);
  console.log();

  // Scan all files
  console.log('Scanning files...');
  scanDirectory(config.srcDir);

  // Group by category
  const grouped = groupByCategory();
  const translations = generateTranslations(grouped);

  // Merge if requested
  const finalTranslations = config.merge
    ? mergeWithExisting(translations)
    : translations;

  // Print statistics
  console.log();
  console.log('📊 Extraction Statistics:');
  console.log(`  Files scanned: ${stats.filesScanned}`);
  console.log(`  Total strings found: ${stats.stringsFound}`);
  console.log(`  Unique strings: ${stats.uniqueStrings}`);
  console.log();
  console.log('  By category:');
  Object.entries(stats.byCategory).forEach(([category, count]) => {
    console.log(`    ${category}: ${count}`);
  });
  console.log();

  // Write or preview
  if (config.dryRun) {
    console.log('📄 Preview (dry run - not writing files):');
    console.log(JSON.stringify(finalTranslations, null, 2));
  } else {
    const outputPath = config.merge ? config.enJsonFile : config.outputFile;
    fs.writeFileSync(outputPath, JSON.stringify(finalTranslations, null, 2));
    console.log(`✅ Extracted strings written to: ${outputPath}`);

    if (!config.merge) {
      console.log();
      console.log('💡 Next steps:');
      console.log('  1. Review extracted.json');
      console.log('  2. Organize strings into proper categories');
      console.log('  3. Merge useful entries into locales/en.json');
      console.log('  4. Translate to Arabic in locales/ar.json');
      console.log('  5. Replace hard-coded strings with t() calls');
    }
  }

  // Generate report file
  if (!config.dryRun) {
    const reportPath = path.resolve(__dirname, '../locales/extraction-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      stats,
      strings: Array.from(extractedStrings.entries()).map(([text, data]) => ({
        text,
        category: data.category,
        count: data.occurrences.length,
        occurrences: data.occurrences,
      })),
    }, null, 2));
    console.log(`📋 Detailed report: ${reportPath}`);
  }
}

// Run
try {
  main();
} catch (error) {
  console.error('❌ Error:', error.message);
  if (config.verbose) {
    console.error(error.stack);
  }
  process.exit(1);
}
