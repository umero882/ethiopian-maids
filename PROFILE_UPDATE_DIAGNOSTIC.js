/**
 * 🔧 Profile Update Diagnostic Script
 *
 * Copy and paste this script into the browser console on the complete-profile page
 * to diagnose profile update issues.
 *
 * Usage:
 * 1. Navigate to /complete-profile
 * 2. Open browser DevTools (F12)
 * 3. Go to Console tab
 * 4. Paste this entire script and press Enter
 * 5. Review the diagnostic results
 */

console.log('🔧 Profile Update Diagnostic Starting...');
console.log('='.repeat(60));

// Test 1: Check Authentication Status
console.log('\n👤 Test 1: Authentication Status');
function checkAuthStatus() {
  try {
    // Check if user is logged in
    const authContext = window.React?.useContext
      ? 'Available'
      : 'Not Available';
    console.log('React Context:', authContext);

    // Check localStorage for user data
    const localUser = localStorage.getItem('ethio-maids-user');
    console.log('LocalStorage User:', localUser ? 'Present' : 'Missing');

    if (localUser) {
      try {
        const userData = JSON.parse(localUser);
        console.log('✅ User Data:', {
          id: userData.id,
          email: userData.email,
          userType: userData.userType,
          name: userData.name,
        });
        return userData;
      } catch (e) {
        console.error('❌ Invalid user data in localStorage:', e);
        return null;
      }
    }

    return null;
  } catch (error) {
    console.error('❌ Auth check failed:', error);
    return null;
  }
}

// Test 2: Check Supabase Connection
console.log('\n🗄️ Test 2: Supabase Connection');
async function checkSupabaseConnection() {
  try {
    const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
    const anonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

    console.log(
      'Supabase URL:',
      supabaseUrl ? `✅ ${supabaseUrl}` : '❌ Missing'
    );
    console.log('Anon Key:', anonKey ? '✅ Present' : '❌ Missing');

    if (!supabaseUrl || !anonKey) {
      console.error('❌ Supabase configuration missing');
      return false;
    }

    // Test basic connectivity
    const response = await fetch(
      `${supabaseUrl}/rest/v1/profiles?select=id&limit=1`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      }
    );

    console.log('✅ Supabase connectivity:', response.status);
    return response.ok;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}

// Test 3: Check Profile Update Function
console.log('\n📝 Test 3: Profile Update Function');
async function testProfileUpdate(userData) {
  if (!userData) {
    console.error('❌ No user data available for testing');
    return false;
  }

  try {
    const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
    const anonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

    // Test data for update
    const testData = {
      name: userData.name || 'Test User',
      updated_at: new Date().toISOString(),
    };

    console.log('🧪 Testing profile update with data:', testData);

    const response = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${userData.id}`,
      {
        method: 'PATCH',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify(testData),
      }
    );

    console.log('Profile update response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Profile update failed:', errorText);
      return false;
    }

    const result = await response.json();
    console.log('✅ Profile update successful:', result);
    return true;
  } catch (error) {
    console.error('❌ Profile update test failed:', error);
    return false;
  }
}

// Test 4: Check RLS (Row Level Security) Policies
console.log('\n🔐 Test 4: RLS Policies');
async function checkRLSPolicies(userData) {
  if (!userData) {
    console.error('❌ No user data available for RLS testing');
    return false;
  }

  try {
    const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
    const anonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

    // Test if user can read their own profile
    const readResponse = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${userData.id}`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
      }
    );

    console.log('Profile read test:', readResponse.status);

    if (readResponse.ok) {
      const profiles = await readResponse.json();
      console.log('✅ Can read profile:', profiles.length > 0 ? 'Yes' : 'No');
      return profiles.length > 0;
    } else {
      console.error('❌ Cannot read profile:', await readResponse.text());
      return false;
    }
  } catch (error) {
    console.error('❌ RLS test failed:', error);
    return false;
  }
}

// Test 5: Check Session Token
console.log('\n🎫 Test 5: Session Token');
function checkSessionToken() {
  try {
    // Check if there's a valid session
    const sessionData = localStorage.getItem(
      'sb-pabjehhnkpyavakduydg-auth-token'
    );
    console.log('Session token:', sessionData ? 'Present' : 'Missing');

    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        console.log('✅ Session data:', {
          access_token: session.access_token ? 'Present' : 'Missing',
          refresh_token: session.refresh_token ? 'Present' : 'Missing',
          expires_at: session.expires_at
            ? new Date(session.expires_at * 1000).toLocaleString()
            : 'Unknown',
        });

        // Check if token is expired
        if (session.expires_at) {
          const isExpired = Date.now() / 1000 > session.expires_at;
          console.log('Token expired:', isExpired ? '❌ Yes' : '✅ No');
          return !isExpired;
        }

        return true;
      } catch (e) {
        console.error('❌ Invalid session data:', e);
        return false;
      }
    }

    return false;
  } catch (error) {
    console.error('❌ Session check failed:', error);
    return false;
  }
}

// Test 6: Check Form Data
console.log('\n📋 Test 6: Form Data');
function checkFormData() {
  try {
    // Look for form elements on the page
    const forms = document.querySelectorAll('form');
    console.log('Forms found:', forms.length);

    const inputs = document.querySelectorAll('input, select, textarea');
    console.log('Input fields found:', inputs.length);

    // Check for required fields
    const requiredFields = document.querySelectorAll('[required]');
    console.log('Required fields:', requiredFields.length);

    // Check for validation errors
    const errorElements = document.querySelectorAll(
      '[class*="error"], .text-red-500, .text-destructive'
    );
    console.log('Error elements found:', errorElements.length);

    if (errorElements.length > 0) {
      console.log('❌ Validation errors present:');
      errorElements.forEach((el, index) => {
        console.log(`  ${index + 1}. ${el.textContent.trim()}`);
      });
      return false;
    }

    console.log('✅ No validation errors found');
    return true;
  } catch (error) {
    console.error('❌ Form data check failed:', error);
    return false;
  }
}

// Run All Tests
async function runAllTests() {
  console.log('\n🚀 Running All Diagnostic Tests...');
  console.log('='.repeat(60));

  const userData = checkAuthStatus();
  const supabaseOk = await checkSupabaseConnection();
  const sessionValid = checkSessionToken();
  const rlsOk = await checkRLSPolicies(userData);
  const profileUpdateOk = await testProfileUpdate(userData);
  const formOk = checkFormData();

  const results = {
    authentication: !!userData,
    supabaseConnection: supabaseOk,
    sessionToken: sessionValid,
    rlsPolicies: rlsOk,
    profileUpdate: profileUpdateOk,
    formValidation: formOk,
  };

  console.log('\n📊 Diagnostic Results Summary:');
  console.log('='.repeat(60));

  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASS' : 'FAIL'}`);
  });

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  console.log(`\n📈 Overall Score: ${passedTests}/${totalTests} tests passed`);

  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Profile update should work correctly.');
  } else {
    console.log('⚠️ Some tests failed. Profile update may not work properly.');
    console.log('\n🔧 Recommended Actions:');

    if (!results.authentication) {
      console.log('• Log in to the application');
    }
    if (!results.supabaseConnection) {
      console.log('• Check internet connection and Supabase configuration');
    }
    if (!results.sessionToken) {
      console.log('• Refresh the page and log in again');
    }
    if (!results.rlsPolicies) {
      console.log('• Check RLS policies in Supabase dashboard');
    }
    if (!results.profileUpdate) {
      console.log('• Check database permissions and table structure');
    }
    if (!results.formValidation) {
      console.log('• Fix form validation errors before submitting');
    }
  }

  return results;
}

// Auto-run the diagnostic
runAllTests().catch((error) => {
  console.error('❌ Diagnostic script failed:', error);
});
