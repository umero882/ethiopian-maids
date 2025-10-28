import React from 'react';
import AuthDebugger from '@/components/AuthDebugger';
import ProfileCompletionDebugger from '@/components/ProfileCompletionDebugger';
import AgencyRegistrationTester from '@/components/AgencyRegistrationTester';
import AgencyRegistrationFlowTester from '@/components/AgencyRegistrationFlowTester';
import AgencyRegistrationQuickTest from '@/components/AgencyRegistrationQuickTest';
import AlertCircleTest from '@/components/AlertCircleTest';
import DashboardFirstTester from '@/components/DashboardFirstTester';
import FormRoutingTester from '@/components/FormRoutingTester';
import SponsorDashboardTester from '@/components/SponsorDashboardTester';
import SponsorDashboardFixVerification from '@/components/SponsorDashboardFixVerification';
import UserTypeDebugger from '@/components/UserTypeDebugger';
import UserTypeCorrector from '@/components/UserTypeCorrector';
import DatabaseUserChecker from '@/components/DatabaseUserChecker';

const AuthDebugPage = () => {
  return (
    <div className='min-h-screen bg-gray-50 py-8'>
      <div className='container mx-auto'>
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 mb-2'>
            Authentication Debug Center
          </h1>
          <p className='text-gray-600'>
            Troubleshoot authentication issues and test Supabase connectivity
          </p>
        </div>

        <AuthDebugger />

        <div className='mt-8'>
          <UserTypeDebugger />
        </div>

        <div className='mt-8'>
          <DatabaseUserChecker />
        </div>

        <div className='mt-8'>
          <UserTypeCorrector />
        </div>

        <div className='mt-8'>
          <SponsorDashboardFixVerification />
        </div>

        <div className='mt-8'>
          <SponsorDashboardTester />
        </div>

        <div className='mt-8'>
          <FormRoutingTester />
        </div>

        <div className='mt-8'>
          <DashboardFirstTester />
        </div>

        <div className='mt-8'>
          <AlertCircleTest />
        </div>

        <div className='mt-8'>
          <AgencyRegistrationQuickTest />
        </div>

        <div className='mt-8'>
          <ProfileCompletionDebugger />
        </div>

        <div className='mt-8'>
          <AgencyRegistrationTester />
        </div>

        <div className='mt-8'>
          <AgencyRegistrationFlowTester />
        </div>

        <div className='mt-8 text-center'>
          <div className='bg-white p-6 rounded-lg shadow-sm max-w-2xl mx-auto'>
            <h3 className='text-lg font-semibold mb-4'>
              How to Use This Debugger
            </h3>
            <div className='text-left space-y-2 text-sm text-gray-600'>
              <p>
                <strong>1. Check Connection:</strong> Verify Supabase database
                connectivity
              </p>
              <p>
                <strong>2. Test Sign In:</strong> Try logging in with your
                credentials
              </p>
              <p>
                <strong>3. Check Session:</strong> Verify current authentication
                state
              </p>
              <p>
                <strong>4. Review Results:</strong> Look for "Invalid API key"
                errors or other issues
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthDebugPage;
