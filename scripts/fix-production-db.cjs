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
  console.log('🔧 Fixing production database configuration...\n');

  try {
    // Add VITE_USE_LOCAL_DATABASE=false for all environments
    console.log('📝 Adding VITE_USE_LOCAL_DATABASE=false...');

    const environments = ['production', 'preview', 'development'];
    for (const env of environments) {
      try {
        await makeRequest('POST', `/projects/${PROJECT_ID}/env`, {
          key: 'VITE_USE_LOCAL_DATABASE',
          value: 'false',
          type: 'plain',
          target: [env]
        });
        console.log(`✅ Added for ${env}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Already exists for ${env}, skipping...`);
        } else {
          console.error(`❌ Failed for ${env}: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Done! Environment variables updated.');
    console.log('🚀 Trigger a new deployment to apply changes.');
    console.log('\nTo redeploy, run:');
    console.log('  git commit --allow-empty -m "chore: trigger redeployment"');
    console.log('  git push origin main');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
