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
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function removeEnvVar(envId) {
  try {
    await makeRequest('DELETE', `/projects/${PROJECT_ID}/env/${envId}`);
    console.log(`✅ Removed environment variable`);
  } catch (error) {
    console.error(`❌ Failed to remove: ${error.message}`);
  }
}

async function addEnvVar(key, value, targets) {
  try {
    await makeRequest('POST', `/projects/${PROJECT_ID}/env`, {
      key,
      value,
      type: 'plain',
      target: targets
    });
    console.log(`✅ Added ${key} for ${targets.join(', ')}`);
  } catch (error) {
    console.error(`❌ Failed to add ${key}: ${error.message}`);
  }
}

async function main() {
  console.log('🔧 Fixing VITE_APP_NAME environment variable...\n');

  // Get all environment variables
  console.log('📋 Fetching current environment variables...');
  const envVars = await makeRequest('GET', `/projects/${PROJECT_ID}/env`);

  // Find and remove all VITE_APP_NAME entries
  const appNameVars = envVars.envs.filter(env => env.key === 'VITE_APP_NAME');
  console.log(`Found ${appNameVars.length} VITE_APP_NAME entries\n`);

  for (const envVar of appNameVars) {
    console.log(`Removing ${envVar.key} (${envVar.target.join(', ')})...`);
    await removeEnvVar(envVar.id);
  }

  // Add new VITE_APP_NAME with plain text value
  console.log('\n📝 Adding new VITE_APP_NAME...');
  await addEnvVar('VITE_APP_NAME', 'Ethiopian Maids Platform', ['production', 'preview', 'development']);

  console.log('\n✅ Done! Environment variable fixed.');
  console.log('🚀 Trigger a new deployment to apply changes.');
}

main().catch(console.error);
