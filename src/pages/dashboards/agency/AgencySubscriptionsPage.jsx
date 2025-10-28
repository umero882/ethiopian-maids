import React from 'react';
import SubscriptionManagement from '@/components/dashboard/SubscriptionManagement';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Users, Building } from 'lucide-react';

const AgencySubscriptionsPage = () => {
  return (
    <div className='space-y-6'>
      <SubscriptionManagement />

      {/* Additional Agency Benefits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className='mt-8'
      >
        <h2 className='text-xl font-bold mb-4'>Agency-Specific Benefits</h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <Card>
            <CardHeader className='pb-2'>
              <Building className='h-6 w-6 text-purple-600 mb-2' />
              <CardTitle className='text-lg'>Agency Branding</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className='space-y-2'>
                <li className='flex items-start'>
                  <CheckCircle className='h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5' />
                  <span className='text-sm'>
                    Custom agency profile with logo and branding
                  </span>
                </li>
                <li className='flex items-start'>
                  <CheckCircle className='h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5' />
                  <span className='text-sm'>
                    Featured placement in agency directory
                  </span>
                </li>
                <li className='flex items-start'>
                  <CheckCircle className='h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5' />
                  <span className='text-sm'>
                    Verification badge to build trust
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2'>
              <Users className='h-6 w-6 text-purple-600 mb-2' />
              <CardTitle className='text-lg'>Maid Management</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className='space-y-2'>
                <li className='flex items-start'>
                  <CheckCircle className='h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5' />
                  <span className='text-sm'>
                    Bulk upload tools for multiple maid profiles
                  </span>
                </li>
                <li className='flex items-start'>
                  <CheckCircle className='h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5' />
                  <span className='text-sm'>
                    Advanced filtering and sorting capabilities
                  </span>
                </li>
                <li className='flex items-start'>
                  <CheckCircle className='h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5' />
                  <span className='text-sm'>
                    Performance tracking for maid profiles
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                fill='none'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
                className='h-6 w-6 text-purple-600 mb-2'
              >
                <path d='M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83' />
              </svg>
              <CardTitle className='text-lg'>Business Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className='space-y-2'>
                <li className='flex items-start'>
                  <CheckCircle className='h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5' />
                  <span className='text-sm'>
                    Comprehensive analytics dashboard
                  </span>
                </li>
                <li className='flex items-start'>
                  <CheckCircle className='h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5' />
                  <span className='text-sm'>
                    Market trends and demand reports
                  </span>
                </li>
                <li className='flex items-start'>
                  <CheckCircle className='h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5' />
                  <span className='text-sm'>
                    Conversion rate optimization tools
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        className='mt-8'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <h2 className='text-xl font-bold mb-4'>Frequently Asked Questions</h2>
        <div className='space-y-4 bg-white p-6 rounded-lg shadow-sm'>
          <div>
            <h3 className='font-medium'>
              How does the maid listing limit work?
            </h3>
            <p className='text-gray-600 mt-1'>
              Each subscription tier comes with a specific number of maid
              profiles you can manage. Free accounts can list up to 3 maids, Pro
              accounts up to 25 maids, and Premium accounts have unlimited
              listings.
            </p>
          </div>
          <div>
            <h3 className='font-medium'>
              Can I transfer my subscription to another agency account?
            </h3>
            <p className='text-gray-600 mt-1'>
              Subscriptions are tied to specific agency accounts and cannot be
              transferred. If you need to change accounts, please contact our
              support team for assistance.
            </p>
          </div>
          <div>
            <h3 className='font-medium'>Do I get priority customer support?</h3>
            <p className='text-gray-600 mt-1'>
              Yes, paid subscriptions include faster customer support response
              times. Premium accounts receive priority support with dedicated
              account managers.
            </p>
          </div>
          <div>
            <h3 className='font-medium'>How does bulk upload work?</h3>
            <p className='text-gray-600 mt-1'>
              Premium subscribers can upload multiple maid profiles
              simultaneously using our CSV template or API. This feature saves
              significant time when managing large numbers of profiles.
            </p>
          </div>
          <div>
            <h3 className='font-medium'>
              Are there any additional fees beyond the subscription?
            </h3>
            <p className='text-gray-600 mt-1'>
              Successful placements facilitated through the platform incur a 500
              AED commission fee, regardless of your subscription level. This
              fee applies only when a hire is confirmed.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AgencySubscriptionsPage;
