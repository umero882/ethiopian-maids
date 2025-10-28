import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: [
      'src/setupTests.js',
      'src/test/setup.js',
      'src/test/vitest.setup.js',
    ],
    globals: true,
    css: false,
    exclude: [
      'e2e/**',
      'node_modules/**',
      '**/node_modules/**',
      'dist/**',
      '.git/**'
    ],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // Monorepo package aliases
      '@ethio-maids/domain-identity': resolve(__dirname, 'packages/domain/identity'),
      '@ethio-maids/domain-profiles': resolve(__dirname, 'packages/domain/profiles'),
      '@ethio-maids/app-identity': resolve(__dirname, 'packages/app/identity'),
      '@ethio-maids/app-profiles': resolve(__dirname, 'packages/app/profiles'),
    },
  },
});
