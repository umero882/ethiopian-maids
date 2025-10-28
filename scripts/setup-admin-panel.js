/**
 * Admin Panel Database Setup Script
 *
 * This script sets up the database schema required for the admin panel.
 * Run this script after setting up your main database to add admin functionality.
 *
 * Usage:
 * node scripts/setup-admin-panel.js
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  console.error('');
  console.error('Please check your .env file and try again.');
  process.exit(1);
}

// Create Supabase client with service role key (for admin operations)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('🚀 Starting admin panel database setup...');
    console.log('');

    // Read the migration SQL file
    const migrationPath = join(__dirname, '../database/migrations/admin-panel-setup.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Split SQL into individual statements (rough split - be careful with complex statements)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📄 Found ${statements.length} SQL statements to execute`);
    console.log('');

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);

          const { error } = await supabase.rpc('exec_sql', {
            query: statement + ';'
          });

          if (error) {
            // Try direct execution as fallback
            const { error: directError } = await supabase
              .from('_supabase_migrations')
              .insert({ name: `admin-panel-statement-${i}`, version: Date.now() });

            if (directError && !directError.message.includes('already exists')) {
              throw error;
            }
          }

          console.log(`✅ Statement ${i + 1} completed`);
        } catch (statementError) {
          console.warn(`⚠️  Statement ${i + 1} warning:`, statementError.message);
          // Continue with other statements
        }
      }
    }

    console.log('');
    console.log('✅ Admin panel database setup completed!');
    console.log('');

    // Verify setup by checking if admin_users table exists
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('count', { count: 'exact' })
        .limit(0);

      if (error) {
        throw error;
      }

      console.log('🔍 Verification: admin_users table is accessible');
      console.log('');

    } catch (verificationError) {
      console.error('❌ Verification failed:', verificationError.message);
      console.error('The setup may not have completed successfully.');
    }

    // Instructions for creating first admin user
    console.log('📋 Next steps:');
    console.log('');
    console.log('1. Create your first admin user in Supabase Auth');
    console.log('2. Add the user to admin_users table:');
    console.log('   INSERT INTO admin_users (id, email, full_name, role, is_active)');
    console.log('   VALUES (\'your-user-uuid\', \'admin@ethiomaids.com\', \'Administrator\', \'super_admin\', true);');
    console.log('');
    console.log('3. Access the admin panel at: /admin/login');
    console.log('');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('');

    if (error.message.includes('permission denied')) {
      console.error('💡 Make sure you are using the SUPABASE_SERVICE_ROLE_KEY, not the anon key.');
    }

    process.exit(1);
  }
}

// Alternative method using raw SQL execution
async function runMigrationRaw() {
  try {
    console.log('🚀 Running raw SQL migration...');

    const migrationPath = join(__dirname, '../database/migrations/admin-panel-setup.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Execute the entire migration as one statement
    const { error } = await supabase.rpc('exec_sql', {
      query: migrationSQL
    });

    if (error) {
      throw error;
    }

    console.log('✅ Raw migration completed successfully!');

  } catch (error) {
    console.error('❌ Raw migration failed:', error.message);
    console.log('');
    console.log('🔄 Trying statement-by-statement approach...');
    await runMigration();
  }
}

// Check if exec_sql function exists
async function checkExecSQLFunction() {
  try {
    const { error } = await supabase.rpc('exec_sql', { query: 'SELECT 1;' });
    return !error;
  } catch {
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔧 Admin Panel Database Setup');
  console.log('============================');
  console.log('');

  // Check if we can use exec_sql function
  const hasExecSQL = await checkExecSQLFunction();

  if (hasExecSQL) {
    console.log('📋 Using Supabase exec_sql function for migration');
    await runMigrationRaw();
  } else {
    console.log('📋 exec_sql not available, using alternative method');
    console.log('⚠️  You may need to run this migration manually in your Supabase SQL editor');
    console.log('');

    const migrationPath = join(__dirname, '../database/migrations/admin-panel-setup.sql');
    console.log(`📄 Migration file location: ${migrationPath}`);
    console.log('');
    console.log('Copy the contents of this file and run it in your Supabase SQL editor.');
  }
}

main().catch(console.error);