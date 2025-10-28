/**
 * 🧪 Jest Configuration
 * Comprehensive testing setup for Ethiopian Maids Platform
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.js'],

  // Module name mapping for path aliases
  moduleNameMapper: {
    '^react$': '<rootDir>/node_modules/react',
    '^react-dom$': '<rootDir>/node_modules/react-dom',
    // Specific aliases before the generic @ alias
    '^@/lib/databaseClient$': '<rootDir>/src/test/__mocks__/databaseClient.js',
    '^@/lib/supabaseClient$': '<rootDir>/src/test/__mocks__/supabaseClient.js',
    '^@/config/stripeConfig$': '<rootDir>/src/test/__mocks__/stripeConfig.js',
    '^@/lib/utils$': '<rootDir>/src/test/__mocks__/utils.js',
    // Mock relative imports to databaseClient
    '\\./(databaseClient)\\.js$': '<rootDir>/src/test/__mocks__/databaseClient.js',
    // Generic alias
    '^@/(.*)$': '<rootDir>/src/$1',
    // Third-party module mocks
    '^dompurify$': '<rootDir>/src/test/__mocks__/dompurify.js',
    '^@radix-ui/(.*)$': '<rootDir>/src/test/__mocks__/radix-ui.js',
    '^@radix-ui/react-slot$': '<rootDir>/src/test/__mocks__/radix-slot.js',
    '^class-variance-authority$': '<rootDir>/src/test/__mocks__/cva.js',
    '^lucide-react$': '<rootDir>/src/test/__mocks__/lucide-react.js',
    '^socket.io-client$': '<rootDir>/src/test/__mocks__/socket.io-client.js',
    '^framer-motion$': '<rootDir>/src/test/__mocks__/framer-motion.js',
    '^@/components/ui/sheet$': '<rootDir>/src/test/__mocks__/ui-sheet.js',
    // Assets and styles
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/test/__mocks__/fileMock.js',
  },

  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],

  // Coverage configuration
  collectCoverage: false, // Disable coverage for now to prevent errors
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.d.ts',
    '!src/test/**',
    '!src/**/__tests__/**',
    '!src/**/*.test.{js,jsx}',
    '!src/**/*.spec.{js,jsx}',
    '!src/main.jsx',
    '!src/vite-env.d.ts',
  ],

  // Disable coverage threshold temporarily
  // coverageThreshold: {
  //   global: {
  //     branches: 70,
  //     functions: 70,
  //     lines: 70,
  //     statements: 70,
  //   },
  // },

  coverageReporters: ['text', 'lcov', 'html'],

  // Transform configuration
  transform: {
    '^.+\\.(js|jsx)$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', {
            targets: { node: 'current' },
            modules: 'commonjs'
          }],
          ['@babel/preset-react', { runtime: 'automatic' }],
        ],
        plugins: [
          'babel-plugin-transform-import-meta'
        ],
      },
    ],
  },

  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(@supabase|@radix-ui)/)',
  ],

  // Global setup for import.meta
  globals: {
    'import.meta': {
      env: {
        DEV: false,
        VITE_STRIPE_PUBLISHABLE_KEY: 'pk_test_mock',
      },
    },
  },

  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'json'],

  // Test timeout
  testTimeout: 10000,

  // Performance and memory optimization
  maxWorkers: 1,
  detectOpenHandles: true,
  forceExit: true,
  workerIdleMemoryLimit: '256MB',
  maxConcurrency: 1,

  // Verbose output
  verbose: false,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost:3000',
  },

  // Disable global setup/teardown for now to prevent ES module issues
  // globalSetup: '<rootDir>/src/test/globalSetup.js',
  // globalTeardown: '<rootDir>/src/test/globalTeardown.js',

  // Watch plugins (removed due to dependency issues)
  // watchPlugins: [
  //   'jest-watch-typeahead/filename',
  //   'jest-watch-typeahead/testname'
  // ],

  // Error handling
  errorOnDeprecated: true,

  // Snapshot serializers (removed due to dependency issues)
  // snapshotSerializers: ['@emotion/jest/serializer'],

  // Disable test results processor for now
  // testResultsProcessor: '<rootDir>/src/test/testResultsProcessor.js',
};
