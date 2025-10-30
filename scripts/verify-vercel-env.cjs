#!/usr/bin/env node

const https = require('https');

const VERCEL_TOKEN = 'olBORiuI87mRG6Qo1NR00mAD';
const PROJECT_ID = 'prj_uqH4j6Ec0UuvkKYS9frhOjemnyHp';
const TEAM_ID = 'team_XnY1b9HZxbTV3OElmnJdJIZI';

async function makeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.vercel.com',
      path: `/v10${path}?teamId=${TEAM_ID}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data || '{}'));
        } else {
          console.error(`Error response: ${data}`);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('🔍 Verifying Vercel Environment Variables...\n');

  try {
    // Get all environment variables
    const result = await makeRequest('GET', `/projects/${PROJECT_ID}/env`);

    console.log(`Found ${result.envs.length} total environment variables\n`);

    // Check critical frontend variables
    const criticalVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_STRIPE_PUBLISHABLE_KEY',
      'VITE_APP_NAME'
    ];

    console.log('📋 Checking critical frontend variables:\n');

    for (const varName of criticalVars) {
      const envVars = result.envs.filter(env => env.key === varName);

      if (envVars.length === 0) {
        console.log(`❌ ${varName}: MISSING`);
      } else {
        console.log(`✅ ${varName}:`);
        envVars.forEach(env => {
          const value = env.value || env.secretReference || 'N/A';
          const displayValue = value.length > 50 ? value.substring(0, 50) + '...' : value;

          // Check for newline characters
          if (value.includes('\\n') || value.includes('\n')) {
            console.log(`   ⚠️  Target: ${env.target.join(', ')} - WARNING: Contains newline character!`);
            console.log(`   Value: "${displayValue}"`);
          } else {
            console.log(`   Target: ${env.target.join(', ')}`);
            console.log(`   Value: ${displayValue}`);
          }
        });
        console.log('');
      }
    }

    console.log('\n📊 All environment variables:');
    console.log('=' .repeat(60));

    const groupedByKey = {};
    result.envs.forEach(env => {
      if (!groupedByKey[env.key]) {
        groupedByKey[env.key] = [];
      }
      groupedByKey[env.key].push(env);
    });

    Object.keys(groupedByKey).sort().forEach(key => {
      console.log(`\n${key}:`);
      groupedByKey[key].forEach(env => {
        console.log(`  - ${env.target.join(', ')}: ${env.type === 'secret' ? '[SECRET]' : 'plain'}`);
      });
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
