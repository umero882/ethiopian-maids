/**
 * Check Translation Completeness
 *
 * Verifies that all English keys exist in Arabic and vice versa.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const enPath = path.join(__dirname, '../locales/en.json');
const arPath = path.join(__dirname, '../locales/ar.json');

const enData = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
const arData = JSON.parse(fs.readFileSync(arPath, 'utf-8'));

function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      keys.push(...flattenKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

const enKeys = flattenKeys(enData);
const arKeys = flattenKeys(arData);

const missingInArabic = enKeys.filter((key) => !arKeys.includes(key));
const missingInEnglish = arKeys.filter((key) => !enKeys.includes(key));

console.log('=== Translation Completeness Check ===\n');
console.log(`Total English keys: ${enKeys.length}`);
console.log(`Total Arabic keys: ${arKeys.length}\n`);

if (missingInArabic.length > 0) {
  console.error('❌ Missing in Arabic:');
  missingInArabic.forEach((key) => console.error(`  - ${key}`));
  console.log();
}

if (missingInEnglish.length > 0) {
  console.error('❌ Missing in English:');
  missingInEnglish.forEach((key) => console.error(`  - ${key}`));
  console.log();
}

if (missingInArabic.length === 0 && missingInEnglish.length === 0) {
  console.log('✅ All translations are complete!');
  process.exit(0);
} else {
  console.error('❌ Translation check failed');
  process.exit(1);
}
