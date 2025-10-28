#!/usr/bin/env node

/**
 * Show extraction statistics and top strings
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const reportPath = path.resolve(__dirname, '../locales/extraction-report.json');

if (!fs.existsSync(reportPath)) {
  console.error('❌ No extraction report found. Run extract-strings.js first.');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

console.log('📊 i18n String Extraction Statistics\n');
console.log(`Report generated: ${new Date(report.timestamp).toLocaleString()}\n`);

console.log('📈 Overall Statistics:');
console.log(`  Files scanned: ${report.stats.filesScanned}`);
console.log(`  Total strings found: ${report.stats.stringsFound}`);
console.log(`  Unique strings: ${report.stats.uniqueStrings}`);
console.log();

console.log('📂 By Category:');
Object.entries(report.stats.byCategory)
  .sort((a, b) => b[1] - a[1])
  .forEach(([category, count]) => {
    const percentage = ((count / report.stats.uniqueStrings) * 100).toFixed(1);
    console.log(`  ${category.padEnd(25)} ${String(count).padStart(5)} (${percentage}%)`);
  });
console.log();

// Top 20 most frequent strings
const sortedByFrequency = [...report.strings]
  .sort((a, b) => b.count - a.count)
  .slice(0, 20);

console.log('🔥 Top 20 Most Frequent Strings:');
sortedByFrequency.forEach((item, index) => {
  const truncated = item.text.length > 60
    ? item.text.substring(0, 57) + '...'
    : item.text;
  console.log(`  ${String(index + 1).padStart(2)}. [${item.count}x] ${truncated}`);
});
console.log();

// Files with most strings
const fileOccurrences = new Map();
report.strings.forEach(item => {
  item.occurrences.forEach(occ => {
    const count = fileOccurrences.get(occ.file) || 0;
    fileOccurrences.set(occ.file, count + 1);
  });
});

const topFiles = [...fileOccurrences.entries()]
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10);

console.log('📁 Top 10 Files with Most Strings:');
topFiles.forEach(([file, count], index) => {
  const shortPath = file.length > 55 ? '...' + file.substring(file.length - 52) : file;
  console.log(`  ${String(index + 1).padStart(2)}. [${String(count).padStart(3)}x] ${shortPath}`);
});
console.log();

console.log('💡 Next Steps:');
console.log('  1. Review locales/extracted.json');
console.log('  2. Organize strings into categories in locales/en.json');
console.log('  3. Translate to Arabic in locales/ar.json');
console.log('  4. Run: node scripts/check-completeness.js');
console.log('  5. Replace hard-coded strings with t() calls');
