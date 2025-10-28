import React from 'react';
import DebugProfileCompletion from '@/components/DebugProfileCompletion';

const DebugPage = () => {
  return (
    <div className='min-h-screen bg-gray-100 py-8'>
      <div className='container mx-auto px-4'>
        <h1 className='text-3xl font-bold text-center mb-8'>Debug Tools</h1>
        <DebugProfileCompletion />
      </div>
    </div>
  );
};

export default DebugPage;
