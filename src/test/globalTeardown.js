/**
 * 🧪 Global Test Teardown
 * Runs once after all tests
 */

export default async () => {
  console.log('🧪 Cleaning up test environment...');

  // Clean up any global resources
  // Reset environment variables
  delete process.env.VITE_APP_ENVIRONMENT;

  console.log('✅ Test environment cleanup complete');
};
