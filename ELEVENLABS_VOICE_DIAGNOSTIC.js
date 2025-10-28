/**
 * 🎤 ElevenLabs Voice Agent Diagnostic Script
 *
 * Copy and paste this script into the browser console on any page
 * to diagnose ElevenLabs voice agent connection issues.
 *
 * Usage:
 * 1. Open browser DevTools (F12)
 * 2. Go to Console tab
 * 3. Paste this entire script and press Enter
 * 4. Review the diagnostic results
 */

console.log('🎤 ElevenLabs Voice Agent Diagnostic Starting...');
console.log('='.repeat(60));

// Test 1: Environment Configuration Check
console.log('\n🔧 Test 1: Environment Configuration');
function checkEnvironmentConfig() {
  const agentId = import.meta.env?.VITE_ELEVENLABS_AGENT_ID;
  const apiKey = import.meta.env?.VITE_ELEVENLABS_API_KEY;

  console.log(
    'Agent ID:',
    agentId ? `✅ ${agentId}` : '❌ Missing VITE_ELEVENLABS_AGENT_ID'
  );
  console.log(
    'API Key:',
    apiKey ? '✅ Present' : '⚠️ Missing VITE_ELEVENLABS_API_KEY (optional)'
  );

  if (!agentId) {
    console.error('❌ CRITICAL: Agent ID is required for voice functionality');
    return false;
  }

  return true;
}

// Test 2: Script Loading Check
console.log('\n📜 Test 2: Script Loading');
function checkScriptLoading() {
  const scripts = Array.from(document.querySelectorAll('script'));
  const elevenLabsScript = scripts.find(
    (script) => script.src && script.src.includes('elevenlabs')
  );

  if (elevenLabsScript) {
    console.log('✅ ElevenLabs script found:', elevenLabsScript.src);
    console.log('Script loaded:', elevenLabsScript.readyState || 'unknown');
  } else {
    console.error('❌ ElevenLabs script not found in DOM');
    return false;
  }

  return true;
}

// Test 3: Custom Element Registration
console.log('\n🧩 Test 3: Custom Element Registration');
function checkCustomElement() {
  const isRegistered = window.customElements?.get('elevenlabs-convai');

  if (isRegistered) {
    console.log('✅ elevenlabs-convai custom element is registered');
    return true;
  } else {
    console.error('❌ elevenlabs-convai custom element not registered');
    console.log(
      'Available custom elements:',
      Array.from(window.customElements?.keys() || [])
    );
    return false;
  }
}

// Test 4: Network Connectivity to ElevenLabs
console.log('\n🌐 Test 4: Network Connectivity');
async function checkNetworkConnectivity() {
  try {
    // Test basic connectivity to ElevenLabs API
    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    console.log('✅ ElevenLabs API connectivity:', response.status);

    if (response.status === 401) {
      console.log(
        '✅ API is reachable (401 = authentication required, which is expected)'
      );
      return true;
    } else if (response.ok) {
      console.log('✅ API is reachable and responding');
      return true;
    } else {
      console.warn('⚠️ API returned status:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ Network connectivity failed:', error.message);
    return false;
  }
}

// Test 5: CSP (Content Security Policy) Check
console.log('\n🛡️ Test 5: Content Security Policy');
function checkCSP() {
  const metaTags = Array.from(
    document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]')
  );

  if (metaTags.length === 0) {
    console.log('ℹ️ No CSP meta tag found');
    return true;
  }

  const cspContent = metaTags[0].getAttribute('content');
  console.log('CSP Policy found:', cspContent.substring(0, 100) + '...');

  // Check if ElevenLabs domains are allowed
  const hasElevenLabsConnect = cspContent.includes('elevenlabs.io');
  const hasUnpkgScript = cspContent.includes('unpkg.com');

  console.log(
    'ElevenLabs domains in connect-src:',
    hasElevenLabsConnect ? '✅' : '❌'
  );
  console.log('unpkg.com in script-src:', hasUnpkgScript ? '✅' : '❌');

  if (!hasElevenLabsConnect) {
    console.error('❌ CSP may be blocking ElevenLabs connections');
    console.log(
      '💡 Add "https://*.elevenlabs.io wss://*.elevenlabs.io" to connect-src'
    );
  }

  return hasElevenLabsConnect && hasUnpkgScript;
}

// Test 6: Widget Creation Test
console.log('\n🎛️ Test 6: Widget Creation Test');
function testWidgetCreation() {
  try {
    const testContainer = document.createElement('div');
    testContainer.style.display = 'none';
    document.body.appendChild(testContainer);

    const widget = document.createElement('elevenlabs-convai');
    widget.setAttribute('agent-id', 'agent_5301k3h9y7cbezt8kq5s38a0857h');
    testContainer.appendChild(widget);

    console.log('✅ Widget element created successfully');
    console.log('Widget tagName:', widget.tagName);
    console.log(
      'Widget attributes:',
      Array.from(widget.attributes).map(
        (attr) => `${attr.name}="${attr.value}"`
      )
    );

    // Cleanup
    document.body.removeChild(testContainer);
    return true;
  } catch (error) {
    console.error('❌ Widget creation failed:', error.message);
    return false;
  }
}

// Test 7: Browser Compatibility
console.log('\n🌍 Test 7: Browser Compatibility');
function checkBrowserCompatibility() {
  const checks = {
    'Custom Elements': !!window.customElements,
    'Web Components':
      !!window.customElements && !!window.HTMLElement.prototype.attachShadow,
    'Fetch API': !!window.fetch,
    WebRTC: !!window.RTCPeerConnection,
    MediaDevices: !!navigator.mediaDevices,
    getUserMedia: !!navigator.mediaDevices?.getUserMedia,
  };

  Object.entries(checks).forEach(([feature, supported]) => {
    console.log(
      `${supported ? '✅' : '❌'} ${feature}: ${supported ? 'Supported' : 'Not supported'}`
    );
  });

  const allSupported = Object.values(checks).every(Boolean);
  return allSupported;
}

// Test 8: Microphone Permissions
console.log('\n🎙️ Test 8: Microphone Permissions');
async function checkMicrophonePermissions() {
  try {
    const permission = await navigator.permissions.query({
      name: 'microphone',
    });
    console.log('Microphone permission state:', permission.state);

    if (permission.state === 'granted') {
      console.log('✅ Microphone access granted');
      return true;
    } else if (permission.state === 'prompt') {
      console.log('⚠️ Microphone access will be prompted');
      return true;
    } else {
      console.log('❌ Microphone access denied');
      return false;
    }
  } catch (error) {
    console.warn('⚠️ Could not check microphone permissions:', error.message);
    return true; // Don't fail the test if we can't check
  }
}

// Run All Tests
async function runAllTests() {
  console.log('\n🚀 Running All Diagnostic Tests...');
  console.log('='.repeat(60));

  const results = {
    environment: checkEnvironmentConfig(),
    scriptLoading: checkScriptLoading(),
    customElement: checkCustomElement(),
    network: await checkNetworkConnectivity(),
    csp: checkCSP(),
    widgetCreation: testWidgetCreation(),
    browserCompatibility: checkBrowserCompatibility(),
    microphone: await checkMicrophonePermissions(),
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
    console.log('🎉 All tests passed! Voice agent should work correctly.');
  } else {
    console.log('⚠️ Some tests failed. Voice agent may not work properly.');
    console.log('\n🔧 Recommended Actions:');

    if (!results.environment) {
      console.log(
        '• Add VITE_ELEVENLABS_AGENT_ID to your environment variables'
      );
    }
    if (!results.scriptLoading) {
      console.log(
        '• Check if ElevenLabs script is properly loaded in index.html'
      );
    }
    if (!results.customElement) {
      console.log('• Wait for script to load completely or refresh the page');
    }
    if (!results.network) {
      console.log('• Check internet connection and firewall settings');
    }
    if (!results.csp) {
      console.log(
        '• Update Content Security Policy to allow ElevenLabs domains'
      );
    }
    if (!results.browserCompatibility) {
      console.log('• Use a modern browser that supports Web Components');
    }
    if (!results.microphone) {
      console.log('• Grant microphone permissions when prompted');
    }
  }

  return results;
}

// Auto-run the diagnostic
runAllTests().catch((error) => {
  console.error('❌ Diagnostic script failed:', error);
});
