/**
 * 🧪 Test Results Processor
 * Processes and formats test results
 */

export default (results) => {
  console.log('📊 Test Results Summary:');
  console.log(`✅ Passed: ${results.numPassedTests}`);
  console.log(`❌ Failed: ${results.numFailedTests}`);
  console.log(`⏭️  Skipped: ${results.numPendingTests}`);
  console.log(
    `📁 Test Suites: ${results.numPassedTestSuites}/${results.numTotalTestSuites}`
  );

  if (results.coverageMap) {
    console.log('📈 Coverage information available');
  }

  return results;
};
