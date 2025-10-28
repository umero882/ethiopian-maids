import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X, CheckCircle2 } from 'lucide-react';

/**
 * AccountStatusCard Component
 * Displays account verification status and statistics
 */
const AccountStatusCard = ({ profileData, sectionAnimation }) => {
  return (
    <motion.div {...sectionAnimation(0.5)}>
      <Card>
        <CardHeader className='bg-gradient-to-r from-gray-50 to-gray-100'>
          <div className='flex items-center gap-3'>
            <CheckCircle2 className='h-6 w-6 text-gray-600' />
            <div>
              <CardTitle>Account Status</CardTitle>
              <CardDescription>Your verification and activity stats</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='pt-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {/* Identity Verification */}
            <div className='p-4 bg-blue-50 rounded-lg border border-blue-100'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-gray-700'>Identity</span>
                {profileData.identity_verified ? (
                  <Check className='h-5 w-5 text-green-600' />
                ) : (
                  <X className='h-5 w-5 text-red-600' />
                )}
              </div>
              <p className='text-xs mt-1 text-gray-600'>
                {profileData.identity_verified ? 'Verified' : 'Not Verified'}
              </p>
              {!profileData.identity_verified && (
                <p className='text-xs mt-2 text-blue-600'>
                  Complete verification to build trust
                </p>
              )}
            </div>

            {/* Background Check */}
            <div className='p-4 bg-purple-50 rounded-lg border border-purple-100'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-gray-700'>Background Check</span>
                {profileData.background_check_completed ? (
                  <Check className='h-5 w-5 text-green-600' />
                ) : (
                  <X className='h-5 w-5 text-red-600' />
                )}
              </div>
              <p className='text-xs mt-1 text-gray-600'>
                {profileData.background_check_completed ? 'Completed' : 'Pending'}
              </p>
              {!profileData.background_check_completed && (
                <p className='text-xs mt-2 text-purple-600'>
                  Increase your credibility
                </p>
              )}
            </div>

            {/* Total Hires */}
            <div className='p-4 bg-green-50 rounded-lg border border-green-100'>
              <span className='text-sm font-medium text-gray-700'>Total Hires</span>
              <p className='text-2xl font-bold text-green-700 mt-1'>
                {profileData.total_hires || 0}
              </p>
              <p className='text-xs mt-1 text-gray-600'>
                Successful placements
              </p>
            </div>

            {/* Average Rating */}
            <div className='p-4 bg-orange-50 rounded-lg border border-orange-100'>
              <span className='text-sm font-medium text-gray-700'>Average Rating</span>
              <div className='flex items-baseline gap-1 mt-1'>
                <p className='text-2xl font-bold text-orange-700'>
                  {Number(profileData.average_rating || 0).toFixed(1)}
                </p>
                <span className='text-lg'>⭐</span>
              </div>
              <p className='text-xs mt-1 text-gray-600'>
                Out of 5.0
              </p>
            </div>
          </div>

          {/* Additional Info */}
          {(!profileData.identity_verified || !profileData.background_check_completed) && (
            <div className='mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg'>
              <p className='text-sm text-yellow-800'>
                <strong>Tip:</strong> Complete your verification to access more features and build trust with maids and agencies.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AccountStatusCard;
