import React from 'react';
import SubscriptionManagement from '@/components/dashboard/SubscriptionManagement';
import { motion } from 'framer-motion';

const MaidSubscriptionsPage = () => {
  return (
    <div className='space-y-6'>
      <SubscriptionManagement />

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
              How do premium features help me find jobs?
            </h3>
            <p className='text-gray-600 mt-1'>
              Premium features give your profile higher visibility in search
              results, allow you to apply to more jobs, and provide verification
              badges that increase employer trust.
            </p>
          </div>
          <div>
            <h3 className='font-medium'>
              Can I cancel my subscription anytime?
            </h3>
            <p className='text-gray-600 mt-1'>
              Yes, you can cancel your subscription at any time. Your benefits
              will continue until the end of your current billing period.
            </p>
          </div>
          <div>
            <h3 className='font-medium'>Will I be charged automatically?</h3>
            <p className='text-gray-600 mt-1'>
              Yes, your subscription will automatically renew at the end of each
              billing cycle. You'll receive a notification before the renewal.
            </p>
          </div>
          <div>
            <h3 className='font-medium'>
              What happens if I downgrade my plan?
            </h3>
            <p className='text-gray-600 mt-1'>
              When you downgrade, you'll keep your current plan benefits until
              the end of your billing cycle. Then, your account will switch to
              the new plan with its features and limitations.
            </p>
          </div>
          <div>
            <h3 className='font-medium'>
              How can I get the most out of my premium subscription?
            </h3>
            <p className='text-gray-600 mt-1'>
              Complete your profile fully, add professional photos, upload all
              your certifications, keep your availability calendar updated, and
              actively apply to new job postings as they appear.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MaidSubscriptionsPage;
