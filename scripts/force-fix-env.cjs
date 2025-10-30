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
  console.log('🔧 Force fixing all VITE_APP_NAME entries...\n');

  try {
    // Get all environment variables
    console.log('📋 Fetching all environment variables...');
    const result = await makeRequest('GET', `/projects/${PROJECT_ID}/env`);

    console.log(`Found ${result.envs.length} total environment variables\n`);

    // Find all VITE_APP_NAME entries
    const appNameVars = result.envs.filter(env => env.key === 'VITE_APP_NAME');

    if (appNameVars.length === 0) {
      console.log('⚠️ No VITE_APP_NAME found. Creating new one...\n');
    } else {
      console.log(`Found ${appNameVars.length} VITE_APP_NAME entries:`);
      appNameVars.forEach(env => {
        console.log(`  - ID: ${env.id}`);
        console.log(`    Target: ${env.target.join(', ')}`);
        console.log(`    Type: ${env.type}`);
        console.log(`    Value: ${env.value || 'N/A'}`);
        console.log('');
      });

      // Delete each one individually
      for (const envVar of appNameVars) {
        console.log(`🗑️  Deleting ${envVar.id}...`);
        try {
          await makeRequest('DELETE', `/projects/${PROJECT_ID}/env/${envVar.id}`);
          console.log(`✅ Deleted successfully\n`);
        } catch (error) {
          console.error(`❌ Failed to delete: ${error.message}\n`);
        }
      }
    }

    // Add new VITE_APP_NAME for each environment separately
    console.log('📝 Adding new VITE_APP_NAME for each environment...\n');

    const environments = ['production', 'preview', 'development'];
    for (const env of environments) {
      try {
        console.log(`Adding for ${env}...`);
        await makeRequest('POST', `/projects/${PROJECT_ID}/env`, {
          key: 'VITE_APP_NAME',
          value: 'Ethiopian Maids Platform',
          type: 'plain',
          target: [env]
        });
        console.log(`✅ Added for ${env}\n`);
      } catch (error) {
        console.error(`❌ Failed to add for ${env}: ${error.message}\n`);
      }
    }

    // Verify
    console.log('🔍 Verifying...');
    const verify = await makeRequest('GET', `/projects/${PROJECT_ID}/env`);
    const newAppNameVars = verify.envs.filter(env => env.key === 'VITE_APP_NAME');

    console.log(`\n✅ Found ${newAppNameVars.length} VITE_APP_NAME entries after fix:`);
    newAppNameVars.forEach(env => {
      console.log(`  - ${env.target.join(', ')}: "${env.value}" (type: ${env.type})`);
    });

    console.log('\n✅ Done! Environment variable completely refreshed.');
    console.log('🚀 Trigger a new deployment now.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
