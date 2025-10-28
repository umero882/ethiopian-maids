import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import SubscriptionManagement from '@/components/dashboard/SubscriptionManagement';
import paymentService from '@/services/paymentService';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, Search, MessageSquare, Target, CreditCard, AlertTriangle, ArrowRight } from 'lucide-react';

const SponsorSubscriptionsPage = () => {
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if payment methods exist in database
    const checkPaymentMethods = async () => {
      try {
        setLoading(true);
        const { data, error } = await paymentService.getPaymentMethods();

        if (error) {
          console.error('Error checking payment methods:', error);
          setHasPaymentMethod(false);
        } else {
          setHasPaymentMethod(data && data.length > 0);
        }
      } catch (error) {
        console.error('Error checking payment methods:', error);
        setHasPaymentMethod(false);
      } finally {
        setLoading(false);
      }
    };

    checkPaymentMethods();

    // Listen for payment method changes via custom event
    const handlePaymentAdded = () => {
      checkPaymentMethods();
    };

    window.addEventListener('paymentMethodAdded', handlePaymentAdded);

    return () => {
      window.removeEventListener('paymentMethodAdded', handlePaymentAdded);
    };
  }, []);

  return (
    <div className='space-y-6'>
      {/* Payment Method Warning Banner */}
      {!hasPaymentMethod && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Alert className='border-2 border-orange-200 bg-orange-50'>
            <AlertTriangle className='h-5 w-5 text-orange-600' />
            <AlertTitle className='text-orange-900 font-semibold text-lg'>
              No Payment Method on File
            </AlertTitle>
            <AlertDescription className='text-orange-800 mt-2'>
              <p className='mb-4'>
                To subscribe to a plan and access premium features, you need to add a payment method first.
                This ensures seamless subscription management and uninterrupted access to all features.
              </p>
              <div className='flex items-center gap-3'>
                <Link to='/dashboard/sponsor/payment-settings'>
                  <Button className='bg-orange-600 hover:bg-orange-700 text-white'>
                    <CreditCard className='h-4 w-4 mr-2' />
                    Add Payment Method
                    <ArrowRight className='h-4 w-4 ml-2' />
                  </Button>
                </Link>
                <p className='text-sm text-orange-700'>
                  Secure payment processing with encryption
                </p>
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      <SubscriptionManagement />

      {/* Additional Sponsor Benefits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className='mt-8'
      >
        <h2 className='text-xl font-bold mb-4'>Sponsor-Specific Benefits</h2>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <Card>
            <CardHeader className='pb-2'>
              <Search className='h-6 w-6 text-blue-600 mb-2' />
              <CardTitle className='text-lg'>Advanced Search</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className='space-y-2'>
                <li className='flex items-start'>
                  <CheckCircle className='h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5' />
                  <span className='text-sm'>
                    Advanced filtering by experience, skills, and language
                  </span>
                </li>
                <li className='flex items-start'>
                  <CheckCircle className='h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5' />
                  <span className='text-sm'>
                    Access to verified candidate profiles
                  </span>
                </li>
                <li className='flex items-start'>
                  <CheckCircle className='h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5' />
                  <span className='text-sm'>
                    Save and compare candidate profiles
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2'>
              <MessageSquare className='h-6 w-6 text-blue-600 mb-2' />
              <CardTitle className='text-lg'>Enhanced Communication</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className='space-y-2'>
                <li className='flex items-start'>
                  <CheckCircle className='h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5' />
                  <span className='text-sm'>
                    Direct messaging with candidates and agencies
                  </span>
                </li>
                <li className='flex items-start'>
                  <CheckCircle className='h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5' />
                  <span className='text-sm'>
                    Video interview scheduling and hosting
                  </span>
                </li>
                <li className='flex items-start'>
                  <CheckCircle className='h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5' />
                  <span className='text-sm'>
                    Document sharing and verification tools
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-2'>
              <Target className='h-6 w-6 text-blue-600 mb-2' />
              <CardTitle className='text-lg'>AI Matching</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className='space-y-2'>
                <li className='flex items-start'>
                  <CheckCircle className='h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5' />
                  <span className='text-sm'>
                    AI-powered candidate matching based on your requirements
                  </span>
                </li>
                <li className='flex items-start'>
                  <CheckCircle className='h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5' />
                  <span className='text-sm'>
                    Personalized recommendations and insights
                  </span>
                </li>
                <li className='flex items-start'>
                  <CheckCircle className='h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5' />
                  <span className='text-sm'>
                    Compatibility scoring with detailed explanations
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Success Stories */}
      <motion.div
        className='mt-8'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <h2 className='text-xl font-bold mb-4'>Success Stories</h2>
        <div className='bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg shadow-sm'>
          <blockquote className='italic text-gray-700 border-l-4 border-blue-500 pl-4'>
            "As a busy professional, I needed to find a qualified maid quickly.
            The premium features helped me identify the perfect candidate within
            days. The advanced filtering and AI matching were game-changers in
            my search."
            <footer className='mt-2 text-sm text-gray-600 not-italic'>
              — Sarah K., Dubai
            </footer>
          </blockquote>

          <blockquote className='italic text-gray-700 border-l-4 border-blue-500 pl-4 mt-6'>
            "The video interview feature saved me so much time. I was able to
            speak with candidates directly before making my decision. Worth
            every dirham of the subscription fee."
            <footer className='mt-2 text-sm text-gray-600 not-italic'>
              — Mohammed A., Abu Dhabi
            </footer>
          </blockquote>
        </div>
      </motion.div>

      {/* FAQ Section */}
      <motion.div
        className='mt-8'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <h2 className='text-xl font-bold mb-4'>Frequently Asked Questions</h2>
        <div className='space-y-4 bg-white p-6 rounded-lg shadow-sm'>
          <div>
            <h3 className='font-medium'>How many job postings can I create?</h3>
            <p className='text-gray-600 mt-1'>
              Free accounts can create 1 active job posting, Pro accounts can
              have up to 5 active postings, and Premium accounts enjoy unlimited
              job postings.
            </p>
          </div>
          <div>
            <h3 className='font-medium'>
              What are the benefits of the AI matching system?
            </h3>
            <p className='text-gray-600 mt-1'>
              Our AI matching system analyzes your requirements against
              candidate profiles to identify the most compatible matches. It
              considers skills, experience, personality traits, and other
              factors that may not be immediately apparent through manual
              searching.
            </p>
          </div>
          <div>
            <h3 className='font-medium'>
              How does the premium verification system work?
            </h3>
            <p className='text-gray-600 mt-1'>
              Premium subscribers gain access to verified profiles where
              background checks, reference validations, and document
              verifications have been conducted. This provides an extra layer of
              security and confidence in your hiring decisions.
            </p>
          </div>
          <div>
            <h3 className='font-medium'>
              Can I share my premium account with other family members?
            </h3>
            <p className='text-gray-600 mt-1'>
              Yes, Premium accounts allow for multiple household members to
              access the account. You can add up to 3 family members who can
              help in the selection and interview process.
            </p>
          </div>
          <div>
            <h3 className='font-medium'>
              Is there any guarantee of finding a suitable candidate?
            </h3>
            <p className='text-gray-600 mt-1'>
              While we cannot guarantee a perfect match, Premium subscribers
              benefit from priority support if you're struggling to find the
              right candidate. Our team will provide personalized assistance and
              recommendations based on your specific requirements.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SponsorSubscriptionsPage;
