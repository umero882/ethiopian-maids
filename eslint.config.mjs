// eslint.config.mjs
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default [
  // Global ignores (replaces .eslintignore)
  {
    ignores: [
      'dist',
      'coverage',
      'babel.config.json',
      'postcss.config.js',
      'tailwind.config.js',
      'vite.config.js',
      'vite.config.backup.js',
      'node_modules',
      '*.html',
      'public/service-worker.js',
      'public/sw.js',
      'src/archive/**/*',
      // Ignore backup snapshots and scratch files
      '**/*_backup.jsx',
      '**/*.backup.jsx',
      'src/__tests__/**/*',
      'src/TestSimpleAuth.jsx',
      'src/test/**/*',
      'src/components/*Tester.jsx',
      'src/components/CameraCapture.jsx',
      'src/components/MapSelector.jsx',
      'src/components/BottomSheet.jsx',
      'src/pages/TestApp.jsx',

      'src/pages/dashboards/maid/EnhancedMaidProfilePage.jsx',
      'src/hooks/useMediaRecording.js',

      // Exclude test and diagnostic files
      '**/__tests__/**/*',
      '**/*.test.{js,jsx}',
      '**/*.spec.{js,jsx}',
      '**/testUtils.{js,jsx}',
      '**/test-utils.{js,jsx}',
      'scripts/**/*',
      '**/*diagnostic*.js',
      '**/*DIAGNOSTIC*.js',
      '**/test-*.{js,cjs}',
      '*-test.{js,cjs}',
      'supabase-connection-test.js',
      'LOGIN_DIAGNOSTIC_SCRIPT.js',
      'e2e/**/*',
      'plugins/**/*',

      // Exclude utility and non-critical components
      'src/components/DataMigration*.jsx',
      'src/components/CropSelector.jsx',
      'src/components/ImageGalleryManager.jsx',
      'src/components/ImageProcessingModal.jsx',
      'src/pages/admin/**/*',
      'src/pages/debug/**/*'
    ],
  },

  // Base JS rules
  js.configs.recommended,

  // Node.js environment files (scripts, diagnostic files, server, etc.)
  {
    files: [
      '**/scripts/**/*.js',
      '**/scripts/**/*.cjs',
      '**/database/scripts/**/*.js',
      'server/**/*.js',
      'server/*.js',
      '**/*diagnostic*.js',
      '**/*DIAGNOSTIC*.js',
      '**/fix-*.js',
      '**/test-*.js',
      '**/debug-*.js',
      '**/cleanup-*.js',
      '**/setup-*.js',
      '**/apply-*.js',
      '**/check-*.js',
      '**/migrate-*.js',
      '**/run-*.js',
      '**/security-*.js',
      '**/validate-*.js',
      '**/verify-*.js',
      '**/server.js',
      'jest.config.js',
      'tmp_setup_db.js',
      'supabase-connection-test.js'
    ],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.node,
        // Additional Node.js globals
        fetch: 'readonly',
        AbortController: 'readonly',
        crypto: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        Intl: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off', // Allow console in Node.js files
      'no-control-regex': 'warn',
      'no-prototype-builtins': 'warn',
      'no-constant-condition': 'warn',
    },
  },

  // E2E test files (Playwright/Node.js environment)
  {
    files: [
      'e2e/**/*.js',
      'playwright*.js',
      '**/e2e-*',
    ],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.node,
        // Playwright globals
        test: 'readonly',
        expect: 'readonly',
        page: 'readonly',
        browser: 'readonly',
        context: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
      // Allow deliberate constant conditions in lightweight test scripts (e.g., if (true) for DEV stubs)
      'no-constant-condition': 'warn',
    },
  },

  // Service Worker files
  {
    files: [
      'public/**/*.js',
      '**/sw-*.js',
      '**/service-worker*.js',
    ],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'script',
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },

  // CommonJS files
  {
    files: ['**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },

  // Browser environment files with DOM access
  {
    files: [
      '**/plugins/**/*.js',
      '**/*DIAGNOSTIC*.js',
      'ELEVENLABS_VOICE_DIAGNOSTIC.js',
      'LOGIN_DIAGNOSTIC_SCRIPT.js',
      'PROFILE_UPDATE_DIAGNOSTIC.js',
      'test-login-flow.js'
    ],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node, // Some diagnostic files need both
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off', // Allow console in diagnostic files
    },
  },

  // Test utility files (Vitest environment)
  {
    files: [
      'src/utils/testUtils.jsx',
      'src/utils/testUtils.js',
      'src/test/test-utils.jsx',
      'src/test/test-utils.js',
    ],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.node,
        vi: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        global: 'writable',
      },
    },
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
    },
  },

  // React JSX files
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        // Development environment
        process: 'readonly',
        // Additional browser APIs
        Intl: 'readonly',
        CustomEvent: 'readonly',
        Event: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        FileReader: 'readonly',
        Blob: 'readonly',
        Image: 'readonly',
        ImageData: 'readonly',
        HTMLCanvasElement: 'readonly',
        PerformanceObserver: 'readonly',
        IntersectionObserver: 'readonly',
        Notification: 'readonly',
        crypto: 'readonly',
        performance: 'readonly',
        screen: 'readonly',
        caches: 'readonly',
        history: 'readonly',
        gtag: 'readonly',
        fbq: 'readonly',
      },
    },
    settings: { 
      react: { version: '18.2' },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx']
        }
      }
    },
    rules: {
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'jsx-a11y/anchor-is-valid': ['warn', { components: ['Link'], specialLink: ['to'] }],
      'jsx-a11y/label-has-associated-control': ['warn', { assert: 'either' }],
      // Temporarily disable unused-vars to reduce lint noise during development
      // TODO: Gradually re-enable and fix unused variables
      'no-unused-vars': 'off',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'react/react-in-jsx-scope': 'off',
      'no-const-assign': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-class-members': 'error',
      'no-unreachable': 'error',
      'no-useless-escape': 'warn',
    },
  },

  // Test files (Jest)
  {
    files: [
      // Standard jest locations
      '**/__tests__/**/*.{js,jsx,ts,tsx,cjs,mjs}',
      '**/*.test.{js,jsx,ts,tsx,cjs,mjs}',
      '**/*.spec.{js,jsx,ts,tsx,cjs,mjs}',
      // Root and scripts test utilities that use jest-style globals
      'test-*.{js,cjs,mjs}',
      '*-test.{js,cjs,mjs}',
      'scripts/**/test-*.{js,cjs,mjs}',
      'scripts/**/*-test.{js,cjs,mjs}',
      '**/setupTests.js',
      '**/TestApp.jsx',
      '**/Test*.jsx',
      'src/test/**/*.js'
    ],
    languageOptions: {
      ecmaVersion: 2023,
      // Many tests are ESM, some are CommonJS (.cjs). ESLint 9 flat config
      // merges globals regardless; keep module for parsing JSX/ESM tests.
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        // Additional testing globals
        global: 'readonly',
        require: 'readonly',
        HTMLCanvasElement: 'readonly',
        process: 'readonly',
        // Explicitly add Jest globals for better compatibility
        jest: 'readonly',
        expect: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        fail: 'readonly',
        vi: 'readonly', // For Vitest compatibility
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },

  // Config files
  {
    files: [
      '*.config.{js,mjs,cjs}',
      '*.config.*.{js,mjs,cjs}',
      '.eslintrc.{js,cjs}',
      'babel.config.json'
    ],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },

  // Service files that use both browser and Node.js APIs
  {
    files: [
      'src/services/**/*.js',
      'src/config/**/*.js',
      'src/lib/**/*.js',
      'src/utils/**/*.js',
      'src/hooks/**/*.js'
    ],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        // Service-specific globals
        require: 'readonly',
        module: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-prototype-builtins': 'warn',
    },
  },
];

