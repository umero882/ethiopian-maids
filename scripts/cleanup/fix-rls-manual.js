import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
  },
});

async function fixRLSPolicies() {
  try {
    console.log('🔧 Fixing RLS policies for user registration...');

    // First, let's check if we can access the profiles table
    console.log('📋 Checking current profiles table access...');
    const { data: _testData, error: testError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (testError) {
      console.log('⚠️ Current RLS is blocking access:', testError.message);
    } else {
      console.log('✅ Can access profiles table');
    }

    // Try to drop and recreate the problematic policies
    console.log('🛠️ Attempting to fix RLS policies...');

    // Execute individual SQL commands
    const sqlCommands = [
      // Drop existing restrictive policies
      `DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;`,
      `DROP POLICY IF EXISTS "Users can insert own profile during registration" ON profiles;`,
      `DROP POLICY IF EXISTS "Allow profile creation during signup" ON profiles;`,
      `DROP POLICY IF EXISTS "Authenticated users can create profile" ON profiles;`,
      `DROP POLICY IF EXISTS "Simple insert policy for registration" ON profiles;`,

      // Create a simple, permissive insert policy
      `CREATE POLICY "Allow authenticated user registration" ON profiles
        FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);`,
    ];

    for (const sql of sqlCommands) {
      try {
        console.log(`Executing: ${sql.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec', { sql });
        if (error) {
          console.log(
            `⚠️ Command failed (this might be expected): ${error.message}`
          );
        } else {
          console.log('✅ Command executed successfully');
        }
      } catch (e) {
        console.log(
          `⚠️ Command exception (this might be expected): ${e.message}`
        );
      }
    }

    console.log('✅ RLS policy fix attempt completed');
  } catch (error) {
    console.error('❌ Exception during RLS fix:', error.message);
  }
}

// Alternative approach: Update the AuthContext to handle the error more gracefully
async function testRegistration() {
  try {
    console.log('🧪 Testing registration flow...');

    // Test if we can create a user (this will help us understand the exact error)
    const testEmail = `test-${Date.now()}@example.com`;
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'ComplexTestPassword2024!@#$%^&*()',
      options: {
        data: {
          name: 'Test User',
          user_type: 'sponsor',
          phone: '+1234567890',
          country: 'Test Country',
          registration_complete: false,
        },
      },
    });

    if (error) {
      console.log('❌ Auth signup error:', error.message);
    } else {
      console.log('✅ Auth signup successful, user ID:', data.user?.id);

      // Now try to insert profile
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: data.user.id,
          email: data.user.email,
          name: 'Test User',
          user_type: 'sponsor',
          phone: '+1234567890',
          country: 'Test Country',
          registration_complete: false,
          updated_at: new Date().toISOString(),
        });

        if (profileError) {
          console.log('❌ Profile creation error:', profileError.message);
          console.log('📋 Error details:', profileError);
        } else {
          console.log('✅ Profile creation successful');
        }

        // Clean up test user
        await supabase.auth.admin.deleteUser(data.user.id);
        console.log('🧹 Test user cleaned up');
      }
    }
  } catch (error) {
    console.error('❌ Test registration error:', error.message);
  }
}

async function main() {
  await fixRLSPolicies();
  await testRegistration();
}

main();
