import React, { useState } from 'react';

const ImportTest = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testDynamicImport = async () => {
    setLoading(true);
    try {
      const module = await import('@/pages/DashboardGateway');
      setResult('✅ Dynamic import successful!');
    } catch (error) {
      console.error('Import failed:', error);
      setResult(`❌ Import failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex items-center justify-center h-screen'>
      <div className='text-center p-8'>
        <h1 className='text-2xl font-bold mb-4'>Dynamic Import Test</h1>
        <button
          onClick={testDynamicImport}
          disabled={loading}
          className='bg-blue-500 text-white px-4 py-2 rounded mb-4 disabled:opacity-50'
        >
          {loading ? 'Testing...' : 'Test DashboardGateway Import'}
        </button>
        <div className='mt-4'>
          <p>{result}</p>
        </div>
      </div>
    </div>
  );
};

export default ImportTest;
