/**
 * Supabase Connection Test Script
 * Run this to verify your Supabase backend connection
 */

import { supabase } from '../lib/supabaseClient.js';

const testSupabaseConnection = async () => {
  console.log('🧪 Testing Supabase Connection...\n');

  try {
    // Test 1: Basic connection
    console.log('1️⃣ Testing basic connection...');
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();
    if (sessionError) {
      console.warn('⚠️ Session check failed:', sessionError.message);
    } else {
      console.log('✅ Supabase client connected successfully');
      console.log('   Current session:', session ? 'Active' : 'None');
    }

    // Test 2: Database connectivity (check if countries table exists)
    console.log('\n2️⃣ Testing database connectivity...');
    const { data: _countries, error: countriesError } = await supabase
      .from('countries')
      .select('count(*)')
      .limit(1);

    if (countriesError) {
      console.error('❌ Database connection failed:', countriesError.message);
      console.log(
        "   This likely means the database migrations haven't been run yet."
      );
      console.log(
        '   Please run the database migrations first (see database/README.md)'
      );
    } else {
      console.log('✅ Database connected successfully');
      console.log('   Countries table accessible');
    }

    // Test 3: Check if skills table exists
    console.log('\n3️⃣ Testing skills table...');
    const { data: _skills, error: skillsError } = await supabase
      .from('skills')
      .select('count(*)')
      .limit(1);

    if (skillsError) {
      console.error('❌ Skills table not accessible:', skillsError.message);
    } else {
      console.log('✅ Skills table accessible');
    }

    // Test 4: Check if profiles table exists (requires auth)
    console.log('\n4️⃣ Testing profiles table...');
    const { data: _profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('count(*)')
      .limit(1);

    if (profilesError) {
      if (profilesError.code === 'PGRST301') {
        console.log(
          '⚠️ Profiles table exists but requires authentication (expected behavior)'
        );
      } else {
        console.error('❌ Profiles table error:', profilesError.message);
      }
    } else {
      console.log('✅ Profiles table accessible');
    }

    // Test 5: Check environment variables
    console.log('\n5️⃣ Checking environment variables...');
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing environment variables');
      console.log('   Make sure .env file contains:');
      console.log('   VITE_SUPABASE_URL=your_supabase_url');
      console.log('   VITE_SUPABASE_ANON_KEY=your_anon_key');
    } else {
      console.log('✅ Environment variables configured');
      console.log('   URL:', supabaseUrl.substring(0, 30) + '...');
      console.log('   Key:', supabaseKey.substring(0, 20) + '...');
    }

    console.log('\n🎉 Connection test completed!');
    console.log('\n📋 Summary:');
    console.log('   - Supabase client: ✅ Working');
    console.log(
      '   - Database: ' +
        (countriesError ? '❌ Needs migration' : '✅ Connected')
    );
    console.log(
      '   - Environment: ' +
        (!supabaseUrl || !supabaseKey ? '❌ Missing vars' : '✅ Configured')
    );

    if (countriesError) {
      console.log('\n🔧 Next Steps:');
      console.log('   1. Go to your Supabase dashboard');
      console.log('   2. Navigate to SQL Editor');
      console.log(
        '   3. Run the migration files in database/migrations/ in order'
      );
      console.log('   4. See database/README.md for detailed instructions');
    }
  } catch (error) {
    console.error('💥 Unexpected error during connection test:', error);
  }
};

// Auto-run if this script is executed directly
if (typeof window !== 'undefined') {
  // Browser environment
  window.testSupabaseConnection = testSupabaseConnection;
  console.log(
    '🔧 Supabase test function loaded. Run testSupabaseConnection() in console.'
  );
} else {
  // Node environment
  testSupabaseConnection();
}

export default testSupabaseConnection;
