#!/usr/bin/env node

const { execSync } = require('child_process');

const envVars = {
  // Supabase
  'VITE_SUPABASE_URL': 'https://kstoksqbhmxnrmspfywm.supabase.co',
  'VITE_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdG9rc3FiaG14bnJtc3BmeXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MTAyNTcsImV4cCI6MjA3NTA4NjI1N30.es6ozZDte5pOHA7Y1exXwdUybM-5WTxnrADKpbSGyzw',

  // App Settings
  'VITE_APP_NAME': 'Ethiopian Maids Platform',
  'VITE_APP_VERSION': '1.0.0',
  'VITE_APP_ENVIRONMENT': 'production',

  // Stripe
  'VITE_STRIPE_PUBLISHABLE_KEY': 'pk_test_51RtCWi3ySFkJEQXkZns3C60KhWwr8XuqXydtnMM2cwnvBNss6CsaeQBwHzrFqBAB9A0QMLbslX3R5FRVuPIaGwG800BRlTQvle',

  // Twilio
  'VITE_TWILIO_ACCOUNT_SID': 'ACbfdadc1ba60a882a64b410046ca3c8a6',
  'VITE_TWILIO_PHONE_NUMBER': '+17176998295',

  // ElevenLabs
  'VITE_ELEVENLABS_AGENT_ID': 'agent_5301k3h9y7cbezt8kq5s38a0857h',

  // Feature Flags
  'VITE_ENABLE_CHAT': 'true',
  'VITE_ENABLE_VIDEO_CALLS': 'false',
  'VITE_ENABLE_ANALYTICS': 'false',

  // Google
  'VITE_GOOGLE_CLIENT_ID': '360906953841-aol08g20r7ltm2a5lf4192j3h3diuhqg.apps.googleusercontent.com'
};

console.log('Adding environment variables to Vercel...\n');

let successCount = 0;
let failCount = 0;

for (const [key, value] of Object.entries(envVars)) {
  try {
    console.log(`Adding ${key}...`);
    execSync(`echo "${value}" | vercel env add ${key} production`, {
      stdio: 'inherit',
      env: { ...process.env, VERCEL_TOKEN: 'olBORiuI87mRG6Qo1NR00mAD' }
    });
    successCount++;
  } catch (error) {
    console.error(`Failed to add ${key}`);
    failCount++;
  }
}

console.log(`\n✅ Added ${successCount} environment variables`);
if (failCount > 0) {
  console.log(`❌ Failed to add ${failCount} environment variables`);
}
