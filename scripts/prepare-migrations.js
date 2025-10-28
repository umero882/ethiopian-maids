#!/usr/bin/env node

/**
 * Prepare migrations for Supabase by cleaning and fixing common issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function cleanSQL(sql) {
  let cleaned = sql;

  // Remove "IF NOT EXISTS" from ADD CONSTRAINT (not supported in all PG versions)
  cleaned = cleaned.replace(/ADD CONSTRAINT IF NOT EXISTS/gi, 'ADD CONSTRAINT');

  // Remove "IF EXISTS" from DROP CONSTRAINT (not always supported)
  cleaned = cleaned.replace(/DROP CONSTRAINT IF EXISTS/gi, 'DROP CONSTRAINT');

  // Wrap ADD CONSTRAINT in DO blocks to handle "already exists" errors
  cleaned = cleaned.replace(
    /ALTER TABLE (\w+)\s+ADD CONSTRAINT (\w+)\s+(CHECK|UNIQUE|FOREIGN KEY|PRIMARY KEY)\s*\(([\s\S]*?)\);/gi,
    (match, table, constraint, type, definition) => {
      return `
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = '${constraint}'
    ) THEN
        ALTER TABLE ${table} ADD CONSTRAINT ${constraint} ${type} (${definition});
    END IF;
END $$;`;
    }
  );

  return cleaned;
}

function prepareMigrations() {
  console.log('🔧 Preparing migrations for Supabase...\n');

  const combinedFile = path.join(__dirname, '..', 'database', 'combined-migrations.sql');
  const outputFile = path.join(__dirname, '..', 'database', 'supabase-migrations.sql');

  if (!fs.existsSync(combinedFile)) {
    console.error('❌ combined-migrations.sql not found');
    process.exit(1);
  }

  console.log('📖 Reading combined migrations...');
  const sql = fs.readFileSync(combinedFile, 'utf8');

  console.log('🧹 Cleaning SQL syntax...');
  const cleaned = cleanSQL(sql);

  console.log('💾 Writing cleaned migrations...');
  fs.writeFileSync(outputFile, cleaned, 'utf8');

  const originalSize = (fs.statSync(combinedFile).size / 1024).toFixed(2);
  const cleanedSize = (fs.statSync(outputFile).size / 1024).toFixed(2);

  console.log(`\n✅ Prepared migrations successfully!`);
  console.log(`   Original: ${originalSize} KB`);
  console.log(`   Cleaned:  ${cleanedSize} KB`);
  console.log(`\n📄 Output: database/supabase-migrations.sql`);
  console.log(`\n📋 Next: Copy this file to Supabase SQL Editor`);
}

prepareMigrations();