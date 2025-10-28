/**
 * 🧪 Global Test Setup
 * Runs once before all tests
 */

export default async () => {
  console.log('🧪 Setting up test environment...');

  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.VITE_APP_ENVIRONMENT = 'test';

  // Suppress console warnings in tests
  const originalWarn = console.warn;
  console.warn = (...args) => {
    // Suppress specific warnings that are expected in tests
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('React Router') ||
        args[0].includes('deprecated') ||
        args[0].includes('componentWillReceiveProps'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };

  console.log('✅ Test environment setup complete');
};
