/**
 * 🔧 Supabase Connection Diagnostic Script
 * Run this in your browser console to diagnose connection issues
 */

async function diagnoseSupabaseConnection() {
  console.log('🔍 Starting Supabase Connection Diagnostic...\n');

  // Get environment variables (you'll need to replace these with your actual values)
  const SUPABASE_URL = 'https://your-new-project-id.supabase.co'; // Replace with your URL
  const SUPABASE_ANON_KEY = 'your_new_anon_key_here'; // Replace with your key

  console.log('📋 Configuration Check:');
  console.log('URL:', SUPABASE_URL);
  console.log(
    'Key:',
    SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 20)}...` : 'NOT SET'
  );
  console.log('');

  // Test 1: Basic connectivity
  console.log('🌐 Test 1: Basic Connectivity');
  try {
    const response = await fetch(SUPABASE_URL, {
      method: 'GET',
      mode: 'no-cors',
    });
    console.log('✅ Basic connectivity: SUCCESS');
  } catch (error) {
    console.error('❌ Basic connectivity: FAILED', error.message);
    console.log(
      '💡 This suggests the Supabase URL is incorrect or the project is down'
    );
  }

  // Test 2: REST API endpoint
  console.log('\n🔌 Test 2: REST API Endpoint');
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });

    if (response.ok) {
      console.log('✅ REST API: SUCCESS (Status:', response.status, ')');
    } else {
      console.warn('⚠️ REST API: Responded but with status:', response.status);
      if (response.status === 401) {
        console.log('💡 Status 401 might indicate invalid API key');
      }
    }
  } catch (error) {
    console.error('❌ REST API: FAILED', error.message);
    if (error.message.includes('CORS')) {
      console.log(
        '💡 CORS error - check if your domain is allowed in Supabase settings'
      );
    }
  }

  // Test 3: Auth endpoint
  console.log('\n🔐 Test 3: Auth Endpoint');
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('✅ Auth endpoint: SUCCESS');
      const settings = await response.json();
      console.log('📋 Auth settings:', settings);
    } else {
      console.warn('⚠️ Auth endpoint: Status', response.status);
    }
  } catch (error) {
    console.error('❌ Auth endpoint: FAILED', error.message);
  }

  // Test 4: Create Supabase client
  console.log('\n🏗️ Test 4: Supabase Client Creation');
  try {
    // This assumes you have @supabase/supabase-js loaded
    if (typeof window !== 'undefined' && window.supabase) {
      console.log('✅ Supabase client: Already exists');
    } else {
      console.log('⚠️ Supabase client: Not found in window object');
      console.log('💡 Try running this after your app has loaded');
    }
  } catch (error) {
    console.error('❌ Supabase client: FAILED', error.message);
  }

  console.log('\n📊 Diagnostic Complete!');
  console.log('');
  console.log('🔧 Next Steps:');
  console.log(
    '1. If basic connectivity failed: Check if your Supabase project is active'
  );
  console.log('2. If REST API failed: Verify your API key is correct');
  console.log('3. If auth failed: Check your project authentication settings');
  console.log('4. Visit https://supabase.com/dashboard to manage your project');
}

// Instructions for use
console.log('🚀 To run the diagnostic, execute: diagnoseSupabaseConnection()');
console.log(
  '📝 First, update the SUPABASE_URL and SUPABASE_ANON_KEY variables in the script'
);
