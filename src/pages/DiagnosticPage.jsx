import React from 'react';
import UserTypeDiagnostic from '@/components/UserTypeDiagnostic';

const DiagnosticPage = () => {
  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='container mx-auto px-4'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Profile Completion Routing Diagnostic
          </h1>
          <p className='text-gray-600'>
            This tool helps diagnose user type detection and profile completion
            routing issues.
          </p>
        </div>

        <UserTypeDiagnostic />
      </div>
    </div>
  );
};

export default DiagnosticPage;
