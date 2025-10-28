#!/usr/bin/env node

/**
 * Minimal test runner - runs one test at a time to prevent memory accumulation
 */

const { spawn } = require('child_process');
const path = require('path');

const jestPath = path.join(__dirname, '..', 'node_modules', 'jest', 'bin', 'jest.js');

// Minimal test configuration
const args = [
  '--max-old-space-size=8192', // Start with 8GB instead of 16GB
  '--expose-gc',
  jestPath,
  '--runInBand',
  '--detectOpenHandles',
  '--forceExit',
  '--bail=1',
  '--no-cache', // Disable caching to save memory
  '--logHeapUsage',
  ...process.argv.slice(2)
];

console.log('🧪 Running minimal memory test...');
console.log('Args:', args.slice(2).join(' '));

const testProcess = spawn('node', args, {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: '--max-old-space-size=8192 --expose-gc'
  }
});

testProcess.on('close', (code) => {
  console.log(`\n✅ Test completed with exit code: ${code}`);
  process.exit(code);
});

testProcess.on('error', (error) => {
  console.error('❌ Test process error:', error);
  process.exit(1);
});