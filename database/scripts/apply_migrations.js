#!/usr/bin/env node

/**
 * Database Migration Script
 * Applies migrations in the correct order from migration_index.txt
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');
const INDEX_FILE = path.join(MIGRATIONS_DIR, 'migration_index.txt');

// Supabase connection details (should be in environment)
const SUPABASE_DB_URL = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
const PGPASSWORD = process.env.DB_PASSWORD;

async function loadMigrationIndex() {
  try {
    const indexContent = fs.readFileSync(INDEX_FILE, 'utf8');
    const lines = indexContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('##') && !line.includes('Backup'));

    console.log(`📋 Found ${lines.length} migrations to apply`);
    return lines;
  } catch (error) {
    console.error('❌ Failed to read migration index:', error.message);
    process.exit(1);
  }
}

async function checkMigrationExists(filename) {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  return fs.existsSync(filePath);
}

async function applyMigration(filename) {
  try {
    const filePath = path.join(MIGRATIONS_DIR, filename);
    console.log(`🔄 Applying migration: ${filename}`);

    if (!SUPABASE_DB_URL) {
      console.log(`⚠️  No database URL configured, skipping actual execution of ${filename}`);
      return;
    }

    // Apply migration using psql
    const { stdout: _stdout, stderr } = await execAsync(
      `psql "${SUPABASE_DB_URL}" -f "${filePath}"`,
      {
        env: { ...process.env, PGPASSWORD }
      }
    );

    if (stderr && !stderr.includes('NOTICE')) {
      console.warn(`⚠️  Migration ${filename} had warnings:`, stderr);
    }

    console.log(`✅ Successfully applied: ${filename}`);
  } catch (error) {
    console.error(`❌ Failed to apply migration ${filename}:`, error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting database migration process...\n');

  try {
    // Load migration order
    const migrations = await loadMigrationIndex();

    // Check all migrations exist
    console.log('🔍 Checking migration files...');
    const missingMigrations = [];

    for (const migration of migrations) {
      if (!(await checkMigrationExists(migration))) {
        missingMigrations.push(migration);
      }
    }

    if (missingMigrations.length > 0) {
      console.error('❌ Missing migration files:', missingMigrations);
      process.exit(1);
    }

    console.log('✅ All migration files found\n');

    // Check database connection
    if (!SUPABASE_DB_URL) {
      console.log('⚠️  DATABASE_URL not set - running in dry-run mode');
      console.log('📋 Migrations that would be applied:\n');
      migrations.forEach((migration, index) => {
        console.log(`${String(index + 1).padStart(3)}. ${migration}`);
      });
      console.log('\n✅ Migration order verified - set DATABASE_URL to apply');
      return;
    }

    // Apply migrations in order
    console.log('🔄 Applying migrations...\n');

    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];
      console.log(`[${i + 1}/${migrations.length}] ${migration}`);
      await applyMigration(migration);
      console.log(''); // Add spacing
    }

    console.log('🎉 All migrations applied successfully!');
    console.log(`📊 Total migrations applied: ${migrations.length}`);

  } catch (error) {
    console.error('💥 Migration process failed:', error.message);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⏹️  Migration process interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Migration process terminated');
  process.exit(1);
});

main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
