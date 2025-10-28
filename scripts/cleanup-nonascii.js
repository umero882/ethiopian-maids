/**
 * Cleanup non-ASCII control characters from source files
 * - Scans common text files and removes non-printable/control bytes
 * - Preserves UTF-8 printable characters (including emojis)
 * - Skips node_modules, dist, coverage
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const INCLUDED_EXT = new Set([
  '.js',
  '.jsx',
  '.json',
  '.md',
  '.css',
  '.html',
  '.cjs',
  '.mjs',
]);
const EXCLUDED_DIRS = new Set(['node_modules', 'dist', 'coverage', '.git']);

function isTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return INCLUDED_EXT.has(ext);
}

function walk(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath, files);
    else if (entry.isFile() && isTextFile(fullPath)) files.push(fullPath);
  }
  return files;
}

// Remove non-printable control characters except common whitespace (\t, \n, \r)
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

function sanitizeContent(content) {
  return content.replace(CONTROL_CHARS, '');
}

function main() {
  const files = walk(ROOT);
  let changed = 0;
  for (const file of files) {
    const original = fs.readFileSync(file, 'utf8');
    const sanitized = sanitizeContent(original);
    if (sanitized !== original) {
      fs.writeFileSync(file, sanitized, 'utf8');
      console.log(`Sanitized: ${path.relative(ROOT, file)}`);
      changed++;
    }
  }
  console.log(`\nSanitization complete. Files updated: ${changed}`);
}

main();
