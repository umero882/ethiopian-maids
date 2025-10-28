// 🔍 Login Diagnostic Script
// Run this in browser console to diagnose authentication issues

console.log('🔍 Starting Login Diagnostic...');

// Test 1: Check Supabase Configuration
console.log('\n📋 Test 1: Supabase Configuration');
try {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  console.log('✅ Supabase URL:', supabaseUrl ? 'Present' : '❌ Missing');
  console.log('✅ Supabase Key:', supabaseKey ? 'Present' : '❌ Missing');

  if (supabaseUrl) {
    console.log(
      '🔗 URL Format:',
      supabaseUrl.startsWith('https://') ? 'Valid HTTPS' : '⚠️ Not HTTPS'
    );
  }
} catch (error) {
  console.error('❌ Configuration Error:', error.message);
}

// Test 2: Enhanced Network Connectivity
console.log('\n🌐 Test 2: Enhanced Network Connectivity');
async function testNetworkConnectivity() {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      console.error('❌ Cannot test - Supabase configuration missing');
      console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Present' : 'Missing');
      console.log('VITE_SUPABASE_ANON_KEY:', anonKey ? 'Present' : 'Missing');
      return;
    }

    console.log('🔗 Testing URL:', supabaseUrl);

    // Test 1: Basic connectivity with timeout
    console.log('\n📡 Test 2.1: Basic REST API connectivity');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        mode: 'cors',
      });

      clearTimeout(timeoutId);
      console.log('✅ REST API Status:', response.status, response.statusText);
      console.log(
        '✅ Response Headers:',
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        console.warn('⚠️ REST API returned non-OK status');
      }
    } catch (restError) {
      console.error('❌ REST API test failed:', restError.message);

      // Test 2: Fallback connectivity test
      console.log('\n📡 Test 2.2: Fallback connectivity test');
      try {
        const controller2 = new AbortController();
        const timeoutId2 = setTimeout(() => controller2.abort(), 5000);

        const fallbackResponse = await fetch(`${supabaseUrl}/`, {
          method: 'GET',
          signal: controller2.signal,
          mode: 'no-cors',
        });

        clearTimeout(timeoutId2);
        console.log('✅ Fallback connectivity: Connection established');
      } catch (fallbackError) {
        console.error('❌ Fallback test also failed:', fallbackError.message);
      }
    }

    // Test 3: Check if it's a CORS issue
    console.log('\n📡 Test 2.3: CORS configuration test');
    try {
      const corsResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'OPTIONS',
        headers: {
          Origin: window.location.origin,
          'Access-Control-Request-Method': 'HEAD',
          'Access-Control-Request-Headers': 'apikey,authorization,content-type',
        },
      });

      console.log('✅ CORS preflight status:', corsResponse.status);
      const corsHeaders = Object.fromEntries(corsResponse.headers.entries());
      console.log('✅ CORS headers:', corsHeaders);

      if (corsHeaders['access-control-allow-origin']) {
        console.log('✅ CORS properly configured');
      } else {
        console.warn('⚠️ CORS may not be properly configured');
      }
    } catch (corsError) {
      console.error('❌ CORS test failed:', corsError.message);
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
    console.error('❌ Error Type:', error.name);

    if (error.message.includes('Failed to fetch')) {
      console.error('🚨 This is likely a CORS or network connectivity issue');
      console.error('💡 Possible causes:');
      console.error('   - Supabase project is paused or deleted');
      console.error('   - Network firewall blocking requests');
      console.error('   - Invalid Supabase URL or key');
      console.error('   - CORS configuration issue');
    }
  }
}

// Test 3: Supabase Client Initialization
console.log('\n🔧 Test 3: Supabase Client');
try {
  // Import and test Supabase client
  import('@/lib/supabaseClient')
    .then(({ supabase }) => {
      console.log(
        '✅ Supabase Client:',
        supabase ? 'Initialized' : '❌ Failed'
      );

      if (supabase) {
        console.log(
          '✅ Auth Client:',
          supabase.auth ? 'Available' : '❌ Missing'
        );
        console.log(
          '✅ Database Client:',
          supabase.from ? 'Available' : '❌ Missing'
        );
      }
    })
    .catch((error) => {
      console.error('❌ Supabase Import Error:', error.message);
    });
} catch (error) {
  console.error('❌ Supabase Client Error:', error.message);
}

// Test 4: Authentication Context
console.log('\n👤 Test 4: Authentication Context');
try {
  import('@/contexts/AuthContext')
    .then(({ useAuth }) => {
      console.log('✅ AuthContext:', useAuth ? 'Available' : '❌ Missing');
    })
    .catch((error) => {
      console.error('❌ AuthContext Import Error:', error.message);
    });
} catch (error) {
  console.error('❌ AuthContext Error:', error.message);
}

// Test 5: Test Login Function
console.log('\n🔐 Test 5: Login Function Test');
async function testLogin(email, password) {
  try {
    console.log('🔄 Testing login with credentials...');

    const { supabase } = await import('@/lib/supabaseClient');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.error('❌ Login Error:', error.message);
      console.error('❌ Error Code:', error.status);
      console.error('❌ Full Error:', error);
      return false;
    }

    if (data.user) {
      console.log('✅ Login Successful');
      console.log('✅ User ID:', data.user.id);
      console.log('✅ User Email:', data.user.email);
      console.log('✅ Session:', data.session ? 'Present' : 'Missing');
      return true;
    }
  } catch (error) {
    console.error('❌ Login Test Error:', error.message);
    console.error('❌ Error Stack:', error.stack);
    return false;
  }
}

// Test 6: Profile Fetch Test
console.log('\n📋 Test 6: Profile Fetch Test');
async function testProfileFetch(userId) {
  try {
    console.log('🔄 Testing profile fetch...');

    const { supabase } = await import('@/lib/supabaseClient');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ Profile Fetch Error:', error.message);
      console.error('❌ Error Code:', error.code);
      console.error('❌ Full Error:', error);

      if (error.code === 'PGRST116') {
        console.log('ℹ️ Profile not found - this is normal for new users');
      }
      return false;
    }

    if (data) {
      console.log('✅ Profile Found');
      console.log('✅ Profile Data:', data);
      return true;
    }
  } catch (error) {
    console.error('❌ Profile Fetch Test Error:', error.message);
    return false;
  }
}

// Run network test immediately
testNetworkConnectivity();

// Export test functions for manual use
window.loginDiagnostic = {
  testLogin,
  testProfileFetch,
  testNetworkConnectivity,
};

console.log('\n🎯 Diagnostic Complete!');
console.log('💡 To test login manually, run:');
console.log(
  '   loginDiagnostic.testLogin("your-email@example.com", "your-password")'
);
console.log('💡 To test profile fetch, run:');
console.log('   loginDiagnostic.testProfileFetch("user-id-here")');
console.log('💡 To test network again, run:');
console.log('   loginDiagnostic.testNetworkConnectivity()');
