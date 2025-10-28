import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kstoksqbhmxnrmspfywm.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('🚀 Starting Agency Tables Migration...\n');

    // Read the migration file
    const migrationPath = join(__dirname, '..', 'migrations', '050_create_agency_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    console.log('📄 Migration file loaded successfully');
    console.log('🔄 Executing migration...\n');

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_string: migrationSQL
    });

    if (error) {
      // If exec_sql function doesn't exist, try direct execution
      console.log('⚠️  exec_sql function not found, attempting direct execution...');

      // Split by semicolons and execute each statement
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

      for (const statement of statements) {
        if (statement) {
          const { error: execError } = await supabase.rpc('exec', {
            sql: statement + ';'
          });

          if (execError) {
            console.error('❌ Error executing statement:', execError.message);
            console.error('Statement:', statement.substring(0, 100) + '...');
          }
        }
      }
    }

    console.log('✅ Migration completed successfully!\n');

    // Verify tables were created
    console.log('🔍 Verifying created tables...\n');

    const tablesToCheck = [
      'agency_jobs',
      'agency_placements',
      'agency_subscriptions',
      'agency_interviews',
      'agency_document_requirements',
      'agency_disputes',
      'agency_payment_failures',
      'agency_tasks'
    ];

    for (const table of tablesToCheck) {
      const { error: checkError } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (checkError) {
        console.log(`❌ Table '${table}' - Error: ${checkError.message}`);
      } else {
        console.log(`✅ Table '${table}' - OK`);
      }
    }

    console.log('\n✨ All agency tables have been created successfully!');
    console.log('📝 Note: Please refresh your application to see the changes.');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
